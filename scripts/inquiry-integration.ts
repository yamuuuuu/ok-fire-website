import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { APIRequestContext, Browser } from '@playwright/test';
import type { Pool } from 'pg';
import sharp from 'sharp';

const sample = {
  inquiryType: 'FIRE_ELECTRIC', customerName: '테스트 고객', phone: '010-2345-6789',
  companyName: '테스트 빌딩', address: '서울 테스트구 테스트로 123', addressDetail: '3층',
  description: '복도 유도등이 켜지지 않습니다. 점검을 요청합니다.',
  preferredContactTime: 'CUSTOM', preferredContactDetail: '평일 오후 2시 이후',
  preferredWorkDate: '2028-02-29', privacyAgreed: true, privacyPolicyVersion: 'integration-test-only',
};
export async function testInquiryApi(api: APIRequestContext, pool: Pool, origin: string) {
  const submit = (data: unknown = sample, key = randomUUID()) => api.post('/api/inquiries', { data, headers: { origin, 'Idempotency-Key': key } });
  const count = async () => Number((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count);
  assert.equal((await api.get('/contact/complete', { maxRedirects: 0 })).status(), 307);
  assert.equal((await api.get('/contact/complete?inquiryNumber=OK-20260915-9999', { maxRedirects: 0 })).status(), 307);
  assert.equal((await api.get('/api/inquiries')).status(), 405);
  assert.equal((await api.post('/api/inquiries', { data: sample, headers: { origin: 'https://evil.example', 'Idempotency-Key': randomUUID() } })).status(), 403);
  assert.equal((await api.post('/api/inquiries', { data: sample, headers: { origin } })).status(), 400);
  for (const data of [{ ...sample, privacyAgreed: false }, { ...sample, phone: 'invalid' }, { ...sample, status: 'COMPLETED' }]) assert.equal((await submit(data)).status(), 422);
  assert.equal((await submit({ ...sample, privacyPolicyVersion: 'stale' })).status(), 409);
  assert.equal((await api.post('/api/inquiries', { data: Buffer.from('{'), headers: { origin, 'Idempotency-Key': randomUUID(), 'Content-Type': 'application/json' } })).status(), 400);
  assert.equal((await api.post('/api/inquiries', { data: 'x', headers: { origin, 'Idempotency-Key': randomUUID(), 'Content-Type': 'text/plain' } })).status(), 415);
  assert.equal((await submit({ ...sample, description: '가'.repeat(12000) })).status(), 413);
  assert.equal(await count(), 0);

  const key = randomUUID();
  const response = await submit(sample, key); assert.equal(response.status(), 201, await response.text());
  const data = (await response.json()).data;
  const day = (await pool.query("SELECT to_char(now() AT TIME ZONE 'Asia/Seoul', 'YYYYMMDD') AS day")).rows[0].day;
  assert.equal(data.inquiryNumber, `OK-${day}-0001`); assert.equal(data.status, 'NEW'); assert.equal(typeof data.id, 'string');
  assert.deepEqual(Object.keys(data).sort(), ['id', 'inquiryNumber', 'status', 'createdAt'].sort());
  const inquiry = (await pool.query('SELECT * FROM inquiries WHERE id=$1', [data.id])).rows[0];
  assert.equal(inquiry.phone, '01023456789'); assert.equal(inquiry.privacy_policy_version, sample.privacyPolicyVersion);
  assert.equal(inquiry.privacy_agreed, true); assert.ok(inquiry.privacy_agreed_at); assert.equal(inquiry.assigned_admin_id, null);
  assert.equal((await pool.query("SELECT to_char(preferred_work_date, 'YYYY-MM-DD') AS date FROM inquiries WHERE id=$1", [data.id])).rows[0].date, '2028-02-29');
  assert.notEqual(inquiry.submission_key_hash, key); assert.ok(/^[a-f0-9]{64}$/.test(inquiry.submission_payload_hash));
  const history = (await pool.query('SELECT * FROM inquiry_status_histories WHERE inquiry_id=$1', [data.id])).rows;
  assert.equal(history.length, 1); assert.equal(history[0].new_status, 'NEW'); assert.equal(history[0].previous_status, null); assert.equal(history[0].changed_by_admin_id, null);
  const receiptCookie = response.headers()['set-cookie'];
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=lax']) assert.ok(receiptCookie.includes(attribute));
  const complete = await api.get('/contact/complete'); assert.equal(complete.status(), 200);
  const html = await complete.text(); assert.ok(html.includes(data.inquiryNumber)); assert.ok(!html.includes(sample.customerName)); assert.ok(!html.includes(sample.phone)); assert.ok(!html.includes(sample.address));
  assert.ok(complete.headers()['cache-control'].includes('no-store')); assert.ok(complete.headers()['x-robots-tag'].includes('noindex'));
  const retry = await submit(sample, key); assert.equal(retry.status(), 201); assert.deepEqual((await retry.json()).data, data);
  assert.equal((await submit({ ...sample, description: '변경된 내용' }, key)).status(), 409);
  assert.equal(await count(), 1);
  assert.equal((await api.get(`/api/inquiries/${data.id}`)).status(), 404);
  console.log('PASS inquiry validation, privacy consent, DB fields, NEW history, receipt privacy and idempotent retry');

  await pool.query('DELETE FROM public_rate_limits');
  const sameKey = randomUUID();
  const duplicate = await Promise.all(Array.from({ length: 5 }, () => submit(sample, sameKey)));
  assert.ok(duplicate.every(r => r.status() === 201));
  const sameIds = await Promise.all(duplicate.map(async r => (await r.json()).data.id)); assert.equal(new Set(sameIds).size, 1);
  const unique = await Promise.all(Array.from({ length: 8 }, () => submit()));
  assert.ok(unique.every(r => r.status() === 201));
  const numbers = await Promise.all(unique.map(async r => (await r.json()).data.inquiryNumber)); assert.equal(new Set(numbers).size, 8);
  assert.equal(await count(), 10);
  assert.equal(Number((await pool.query('SELECT count(*) FROM inquiry_status_histories')).rows[0].count), 10);

  await pool.query(`CREATE FUNCTION test_reject_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'integration rollback test'; END; $$`);
  await pool.query('CREATE TRIGGER test_reject_history BEFORE INSERT ON inquiry_status_histories FOR EACH ROW EXECUTE FUNCTION test_reject_history()');
  const beforeCounter = (await pool.query('SELECT value FROM inquiry_counters WHERE day=$1', [day])).rows[0].value;
  try {
    assert.equal((await submit()).status(), 500);
    assert.equal(await count(), 10);
    assert.equal((await pool.query('SELECT value FROM inquiry_counters WHERE day=$1', [day])).rows[0].value, beforeCounter);
  } finally {
    await pool.query('DROP TRIGGER test_reject_history ON inquiry_status_histories');
    await pool.query('DROP FUNCTION test_reject_history()');
  }
  await pool.query('UPDATE inquiry_counters SET value=9999 WHERE day=$1', [day]);
  const overflow = await submit(); assert.equal(overflow.status(), 201); assert.equal((await overflow.json()).data.inquiryNumber, `OK-${day}-10000`);
  console.log('PASS simultaneous requests, unique daily numbers, 10000th number and complete transaction rollback');

  await pool.query('DELETE FROM public_rate_limits');
  for (let i = 0; i < 30; i++) assert.equal((await submit({ ...sample, privacyAgreed: false })).status(), 422);
  const limited = await submit(); assert.equal(limited.status(), 429); assert.equal(limited.headers()['retry-after'], '900');
  await pool.query("UPDATE public_rate_limits SET expires_at=now() - interval '1 second'");
  assert.equal((await submit()).status(), 201);
  await pool.query('DELETE FROM public_rate_limits');
  console.log('PASS public submission rate limit and expiry reset');
}

export async function testInquiryBrowser(browser: Browser, pool: Pool, origin: string, dir: string) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const next = () => page.getByRole('button', { name: '다음', exact: true }).click();
  const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  try {
    await page.goto(`${origin}/contact`);
    await next(); assert.ok(await page.getByText('문의 유형을 선택해주세요.', { exact: true }).isVisible());
    await page.getByRole('radio', { name: '소방전기 감지기 · 수신기 · 유도등' }).check();
    await noOverflow(); await page.screenshot({ path: join(dir, 'contact-mobile-step1.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 }); await noOverflow(); await page.screenshot({ path: join(dir, 'contact-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await next(); await next(); assert.ok(await page.getByText('현장 주소를 입력해주세요.', { exact: true }).isVisible());
    await page.getByLabel('현장 주소', { exact: true }).fill(sample.address);
    await page.getByLabel('상세주소').fill('3층');
    await page.getByRole('button', { name: '이전', exact: true }).click(); await next();
    assert.equal(await page.getByLabel('현장 주소', { exact: true }).inputValue(), sample.address);
    await next(); await page.getByLabel('문의 내용', { exact: true }).fill(sample.description);
    const photo = await sharp({ create: { width: 80, height: 60, channels: 3, background: '#bb0000' } }).png().toBuffer();
    const photoInput = page.getByLabel('현장 사진 선택', { exact: true });
    await photoInput.setInputFiles(Array.from({ length: 11 }, (_, index) => ({ name: `photo-${index}.png`, mimeType: 'image/png', buffer: photo })));
    assert.ok(await page.getByText('사진은 최대 10장까지 선택해주세요.', { exact: true }).isVisible());
    await photoInput.setInputFiles({ name: '현장.png', mimeType: 'image/png', buffer: photo });
    assert.ok(await page.getByAltText('현장.png 미리보기').isVisible());
    await page.screenshot({ path: join(dir, 'photo-mobile-preview.png'), fullPage: true });
    await page.getByLabel('공사 희망일').fill('2028-02-29'); await noOverflow(); await next();
    await page.getByLabel('고객명', { exact: true }).fill('브라우저 고객'); await page.getByLabel('연락처', { exact: true }).fill('010-3456-7890');
    await page.getByLabel('희망 연락시간 선택').selectOption('CUSTOM'); await next();
    assert.ok(await page.getByText('희망 연락시간을 입력해주세요.', { exact: true }).isVisible());
    await page.getByLabel('희망 연락시간 직접 입력', { exact: true }).fill('오후 3시'); await next();
    await page.getByRole('button', { name: '상담 접수하기', exact: true }).click();
    assert.ok(await page.getByText('개인정보 수집·이용에 동의해주세요.', { exact: true }).isVisible());
    await page.getByRole('checkbox').check(); await noOverflow();
    await page.screenshot({ path: join(dir, 'contact-mobile-review.png'), fullPage: true });
    const before = Number((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count);
    // Server stores the inquiry, but the browser loses the response. Retry must reuse the same key.
    let loseFirstResponse = true;
    let loseUploadResponse = true;
    await page.route('**/attachments/*/complete', async route => {
      if (loseUploadResponse) { loseUploadResponse = false; await route.fetch(); await route.abort('failed'); }
      else await route.continue();
    });
    await page.route('**/api/inquiries', async route => {
      if (loseFirstResponse) { loseFirstResponse = false; await route.fetch(); await route.abort('failed'); }
      else await route.continue();
    });
    await page.getByRole('button', { name: '상담 접수하기', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '접수 결과를 확인하지 못했습니다.' }).waitFor();
    assert.equal(Number((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count), before + 1);
    await page.getByRole('button', { name: '상담 접수하기', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '일부 사진의 저장 결과를 확인하지 못했습니다.' }).waitFor();
    assert.ok(await page.getByRole('button', { name: '이전', exact: true }).isDisabled());
    await page.getByRole('button', { name: '사진 업로드 다시 시도', exact: true }).click();
    await page.waitForURL(`${origin}/contact/complete`);
    const photoCount = (await pool.query("SELECT count(*) FROM inquiry_attachments a JOIN inquiries i ON i.id=a.inquiry_id WHERE i.customer_name='브라우저 고객'")).rows[0].count;
    assert.equal(photoCount, '1');
    assert.equal(Number((await pool.query('SELECT count(*) FROM inquiries')).rows[0].count), before + 1);
    assert.ok(await page.getByRole('heading', { name: '상담 접수가 완료되었습니다.' }).isVisible());
    assert.ok(!(await page.textContent('body'))!.includes('브라우저 고객'));
    assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
    await page.reload(); assert.ok(await page.getByRole('heading', { name: '상담 접수가 완료되었습니다.' }).isVisible());
    await noOverflow(); await page.screenshot({ path: join(dir, 'contact-mobile-complete.png'), fullPage: true });
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS five-step mobile form, back navigation, validation, lost-response retry without duplicates, completion and no PII storage');
  } finally { await context.close(); }
}
