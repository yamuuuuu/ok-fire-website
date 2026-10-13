import assert from 'node:assert/strict';
import test from 'node:test';
import { emailConfig, inquiryEmail, sendInquiryEmail } from '../src/lib/inquiry-email';

const env = { INQUIRY_EMAIL_ENABLED: 'true', RESEND_API_KEY: 'test-only', INQUIRY_EMAIL_FROM: 'notifications@mail.example.com', INQUIRY_EMAIL_TO: 'owner@example.com', APP_ORIGIN: 'https://example.com' };
test('notification requires explicit enablement and complete secure configuration', () => {
  assert.equal(emailConfig({ ...env, INQUIRY_EMAIL_ENABLED: 'false' }), null);
  assert.equal(emailConfig({ ...env, RESEND_API_KEY: '' }), null);
  assert.equal(emailConfig({ ...env, APP_ORIGIN: 'http://example.com' }), null);
  assert.equal(emailConfig({ ...env, INQUIRY_EMAIL_TO: 'one@example.com,two@example.com' }), null);
  assert.ok(emailConfig(env));
});
test('email only includes selected non-customer fields and protected admin link', () => {
  const input = { id: BigInt(1), inquiryNumber: 'OK-20261014-0001', inquiryType: 'REPAIR' as const, createdAt: new Date('2026-10-14T00:00:00Z'), phone: '01099998888', customerName: '비공개성명', address: '비공개주소', description: '비공개문의' };
  const mail = inquiryEmail(input, emailConfig(env)!);
  for (const privateValue of [input.phone, input.customerName, input.address, input.description]) assert.ok(!JSON.stringify(mail).includes(privateValue));
  assert.ok(mail.text.includes('https://example.com/admin/inquiries/1'));
  assert.ok(mail.text.includes('수리/보수'));
});
test('provider requests use a stable key; transient and permanent failures are distinguished', async () => {
  const transport: typeof fetch = async (_url, init) => {
    assert.equal((init?.headers as Record<string, string>)['Idempotency-Key'], 'inquiry/stable-id');
    return new Response(JSON.stringify({ id: 'provider-id' }), { status: 200 });
  };
  assert.deepEqual(await sendInquiryEmail({}, 'inquiry/stable-id', 'fake', transport), { ok: true, id: 'provider-id' });
  assert.deepEqual(await sendInquiryEmail({}, 'key', 'fake', async () => new Response('', { status: 429 })), { ok: false, code: 'HTTP_429', retryable: true });
  assert.deepEqual(await sendInquiryEmail({}, 'key', 'fake', async () => new Response('', { status: 403 })), { ok: false, code: 'HTTP_403', retryable: false });
  assert.deepEqual(await sendInquiryEmail({}, 'key', 'fake', async () => { throw new Error('secret response'); }), { ok: false, code: 'NETWORK_ERROR', retryable: true });
});
