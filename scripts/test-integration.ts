import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes, createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import EmbeddedPostgres from 'embedded-postgres';
import { Pool } from 'pg';
import S3rver from 's3rver';
import { testUploads } from './upload-integration';
import { testInquiryApi, testInquiryBrowser } from './inquiry-integration';
import { testAdminInquiryApi, testAdminInquiryBrowser } from './admin-inquiry-integration';
import { chromium, request as playwrightRequest } from '@playwright/test';
async function freePort() {
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const port = address.port; await new Promise<void>(r => server.close(() => r())); return port;
}
async function testPrivacyGate(env: NodeJS.ProcessEnv) {
  const port = await freePort();
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    env: { ...env, PRIVACY_RETENTION_TEXT: '' }, stdio: 'ignore',
  });
  try {
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
      if (server.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'Privacy gate server did not start');
    const page = await fetch(`${base}/contact`);
    assert.ok((await page.text()).includes('상담 접수를 준비하고 있습니다.'));
    const response = await fetch(`${base}/api/inquiries`, { method: 'POST', headers: { origin: env.APP_ORIGIN! } });
    assert.equal(response.status, 503);
    console.log('PASS missing privacy retention disables public submissions');
  } finally {
    if (server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
  }
}
async function main() {
  const dir = await mkdtemp(join(tmpdir(), 'okfire-integration-'));
  const [pgPort, appPort, tlsPort, storagePort] = await Promise.all([freePort(), freePort(), freePort(), freePort()]);
  const password = randomBytes(24).toString('hex'); const adminPassword = randomBytes(24).toString('hex');
  const postgres = new EmbeddedPostgres({ databaseDir: join(dir, 'pg'), user: 'postgres', password, port: pgPort, persistent: false, authMethod: 'scram-sha-256', postgresFlags: ['-h', '127.0.0.1', '-k', dir, '-c', 'timezone=Asia/Seoul'], onLog: () => {}, onError: () => {} });
  const origin = `https://localhost:${tlsPort}`;
  const env = { ...process.env, DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${pgPort}/okfire`, DIRECT_URL: `postgresql://postgres:${password}@127.0.0.1:${pgPort}/okfire`, APP_ORIGIN: origin, AUTH_SECRET: randomBytes(32).toString('hex'), SEED_ADMIN_NAME: '테스트 관리자', SEED_ADMIN_EMAIL: 'test@example.com', SEED_ADMIN_PASSWORD: adminPassword, NODE_ENV: 'production' as const, VERCEL: '0', PRIVACY_RETENTION_TEXT: '통합테스트용 보유기간 (운영정책 아님)', PRIVACY_CONTACT_TEXT: '테스트 문의처', PRIVACY_POLICY_VERSION: 'integration-test-only' };
  let app: ChildProcess | undefined; let pool: Pool | undefined; let started = false;
  Object.assign(env, { STORAGE_ENDPOINT: `http://localhost:${storagePort}`, STORAGE_REGION: 'us-east-1', STORAGE_BUCKET: 'okfire-test', STORAGE_ACCESS_KEY_ID: 'S3RVER', STORAGE_SECRET_ACCESS_KEY: 'S3RVER' });
  const objectStorage = new S3rver({ address: 'localhost', port: storagePort, silent: true, directory: join(dir, 'objects'), resetOnClose: true, configureBuckets: [{ name: 'okfire-test', configs: [`<CORSConfiguration><CORSRule><AllowedOrigin>${origin}</AllowedOrigin><AllowedMethod>PUT</AllowedMethod><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader></CORSRule></CORSConfiguration>`] }] });
  let storageStarted = false;
  let proxy: ReturnType<typeof createHttpsServer> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let api: Awaited<ReturnType<typeof playwrightRequest.newContext>> | undefined;
  function run(args: string[]) {
    const result = spawnSync('npm', args, { env, encoding: 'utf8' });
    assert.equal(result.status, 0, `npm ${args.join(' ')} failed: ${result.stderr}`);
  }
  try {
    await objectStorage.run(); storageStarted = true;
    await postgres.initialise(); await postgres.start(); started = true; await postgres.createDatabase('okfire');
    run(['run', 'db:deploy']); run(['run', 'db:seed']);
    pool = new Pool({ connectionString: env.DATABASE_URL });
    assert.equal((await pool.query('SELECT count(*) FROM admins')).rows[0].count, '1');
    const seeded = (await pool.query('SELECT * FROM admins')).rows[0];
    assert.equal(seeded.role, 'SUPER_ADMIN'); assert.notEqual(seeded.password_hash, adminPassword);
    run(['run', 'db:seed']);
    assert.equal((await pool.query('SELECT password_hash FROM admins')).rows[0].password_hash, seeded.password_hash);
    console.log('PASS PostgreSQL migration, SUPER_ADMIN seed and repeat-safe seed');
    await testPrivacyGate(env);
    const cert = join(dir, 'cert.pem'), key = join(dir, 'key.pem');
    const openssl = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
    assert.equal(openssl.status, 0, 'openssl certificate generation failed');
    app = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(appPort)], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let appOutput = ''; app.stdout?.on('data', chunk => { appOutput += chunk.toString(); }); app.stderr?.on('data', chunk => { appOutput += chunk.toString(); });
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`http://127.0.0.1:${appPort}/`)).ok) break; } catch {}
      if (i === 99 || app.exitCode !== null) throw new Error(`App did not start: ${appOutput}`);
      await new Promise(r => setTimeout(r, 200));
    }
    proxy = createHttpsServer({ key: await readFile(key), cert: await readFile(cert) }, (req, res) => {
      const upstream = httpRequest({ hostname: '127.0.0.1', port: appPort, path: req.url, method: req.method, headers: { ...req.headers, 'x-forwarded-proto': 'https' } }, incoming => { res.writeHead(incoming.statusCode ?? 502, incoming.headers); incoming.pipe(res); });
      upstream.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(upstream);
    });
    proxy.listen(tlsPort); await once(proxy, 'listening');
    api = await playwrightRequest.newContext({ baseURL: origin, ignoreHTTPSErrors: true });
    const login = (email = env.SEED_ADMIN_EMAIL, secret = adminPassword, headers = { origin }) => api!.post('/api/admin/auth/login', { data: { email, password: secret }, headers });
    const hash = (token: string) => createHash('sha256').update(token).digest('hex');
    assert.equal((await api.get('/admin', { maxRedirects: 0 })).status(), 307);
    assert.equal((await api.get('/api/admin/auth/me')).status(), 401);
    assert.equal((await api.get('/api/admin/auth/me', { headers: { cookie: `__Host-okfire_session=${'f'.repeat(64)}` } })).status(), 401);
    assert.equal((await api.get('/admin', { headers: { cookie: `__Host-okfire_session=${'f'.repeat(64)}` }, maxRedirects: 0 })).status(), 307);
    assert.equal((await login(env.SEED_ADMIN_EMAIL, adminPassword, { origin: 'https://evil.example' })).status(), 403);
    assert.equal((await api.post('/api/admin/auth/logout')).status(), 403);
    assert.equal((await api.post('/api/admin/auth/login', { data: { email: 'bad', password: 'x' }, headers: { origin } })).status(), 422);
    assert.equal((await login(env.SEED_ADMIN_EMAIL, 'wrong')).status(), 401);
    const response = await login(); assert.equal(response.status(), 200, await response.text());
    const cookieHeader = response.headers()['set-cookie'];
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=lax', 'Path=/']) assert.ok(cookieHeader.includes(attribute));
    assert.ok(!cookieHeader.includes('Domain='));
    const firstToken = (await api.storageState()).cookies.find(c => c.name === '__Host-okfire_session')!.value;
    const stored = (await pool.query('SELECT token_hash FROM admin_sessions')).rows[0].token_hash;
    assert.equal(stored, hash(firstToken)); assert.notEqual(stored, firstToken);
    const ttl = Number((await pool.query('SELECT extract(epoch from (expires_at - now())) AS ttl FROM admin_sessions')).rows[0].ttl);
    assert.ok(ttl > 28780 && ttl <= 28800, `Expected 8-hour session lifetime, got ${ttl} seconds`);
    const me = await api.get('/api/admin/auth/me'); assert.equal(me.status(), 200);
    const identity = await me.json(); assert.equal(identity.data.admin.role, 'SUPER_ADMIN'); assert.equal(typeof identity.data.admin.id, 'string');
    assert.ok(!JSON.stringify(identity).includes('password'));
    assert.equal((await api.get('/admin')).status(), 200);
    await login(); assert.equal((await pool.query('SELECT count(*) FROM admin_sessions WHERE token_hash=$1', [hash(firstToken)])).rows[0].count, '0');
    console.log('PASS login, cookie security, session hashing, rotation, route protection, validation and CSRF');
    await pool.query("UPDATE admins SET status='INACTIVE'"); assert.equal((await api.get('/api/admin/auth/me')).status(), 401); assert.equal((await login()).status(), 401);
    await pool.query("UPDATE admins SET status='LOCKED'"); assert.equal((await login()).status(), 401);
    await pool.query("UPDATE admins SET status='ACTIVE', deleted_at=now()"); assert.equal((await api.get('/api/admin/auth/me')).status(), 401); assert.equal((await login()).status(), 401);
    await pool.query('UPDATE admins SET deleted_at=NULL');
    await pool.query("UPDATE admin_sessions SET expires_at=now() - interval '1 second'"); assert.equal((await api.get('/api/admin/auth/me')).status(), 401);
    await pool.query('DELETE FROM auth_rate_limits'); await login();
    const logoutToken = (await api.storageState()).cookies.find(c => c.name === '__Host-okfire_session')!.value;
    assert.equal((await api.post('/api/admin/auth/logout', { headers: { origin } })).status(), 200);
    assert.equal((await api.get('/api/admin/auth/me', { headers: { cookie: `__Host-okfire_session=${logoutToken}` } })).status(), 401);
    assert.equal((await pool.query('SELECT count(*) FROM admin_sessions WHERE token_hash=$1', [hash(logoutToken)])).rows[0].count, '0');
    console.log('PASS inactive/locked/deleted account rejection, expiry and logout revocation');
    await pool.query('DELETE FROM auth_rate_limits');
    const attempts = await Promise.all(Array.from({ length: 12 }, () => login('unknown@example.com', 'wrong')));
    assert.equal(attempts.filter(r => r.status() === 401).length, 10); assert.equal(attempts.filter(r => r.status() === 429).length, 2);
    await pool.query("UPDATE auth_rate_limits SET expires_at=now() - interval '1 second'"); assert.equal((await login('unknown@example.com', 'wrong')).status(), 401);
    const logs = (await pool.query('SELECT * FROM admin_activity_logs')).rows;
    assert.ok(logs.some(l => l.action_type === 'LOGIN')); assert.ok(logs.some(l => l.action_type === 'LOGOUT'));
    assert.ok(!JSON.stringify(logs).includes(adminPassword));
    console.log('PASS concurrent database-backed rate limiting, window reset and activity logs');
    await pool.query('DELETE FROM auth_rate_limits');
    await testInquiryApi(api, pool, origin);
    await testUploads(api, pool, origin, login);
    const adminInquiryId = await testAdminInquiryApi(api, pool, origin, login);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); const browserErrors: string[] = []; page.on('pageerror', err => browserErrors.push(err.message));
    await page.goto(`${origin}/admin`); await page.waitForURL('**/admin/login');
    await page.screenshot({ path: join(dir, 'login-mobile.png'), fullPage: true });
    await page.getByLabel('이메일').fill(env.SEED_ADMIN_EMAIL); await page.getByLabel('비밀번호', { exact: true }).fill(adminPassword);
    await page.getByRole('button', { name: '로그인', exact: true }).click(); await page.waitForURL(`${origin}/admin`);
    assert.ok(await page.getByRole('heading', { name: '관리자 홈' }).isVisible());
    assert.ok(await page.getByRole('navigation', { name: '모바일 관리자 메뉴' }).isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(dir, 'admin-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.ok(await page.getByRole('navigation', { name: '관리자 메뉴', exact: true }).isVisible());
    await page.screenshot({ path: join(dir, 'admin-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: '로그아웃', exact: true }).click(); await page.waitForURL('**/admin/login');
    assert.equal(browserErrors.length, 0, browserErrors.join('\n'));
    console.log(`PASS mobile/desktop browser login, navigation, no overflow, logout and no JS errors. Screenshots: ${dir}`);
    await testInquiryBrowser(browser, pool, origin, dir);
    await testAdminInquiryBrowser(browser, origin, env.SEED_ADMIN_EMAIL, adminPassword, adminInquiryId, dir);
    const publicContext = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const publicPage = await publicContext.newPage(); const publicErrors: string[] = []; publicPage.on('pageerror', error => publicErrors.push(error.message));
    await publicPage.goto(origin); assert.ok(await publicPage.getByRole('heading', { name: '소방설비는 경험이 중요합니다.' }).isVisible());
    assert.ok(await publicPage.getByRole('link', { name: '간편 상담 접수' }).last().isVisible()); assert.ok(await publicPage.getByLabel('대표 전화번호 준비 중').isVisible());
    await publicPage.getByRole('button', { name: '메뉴' }).click(); assert.ok(await publicPage.locator('#public-menu').getByRole('link', { name: '작업사례' }).isVisible());
    await publicPage.screenshot({ path: join(dir, 'public-home-mobile.png'), fullPage: true }); assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const path of ['/about', '/services', '/services/fire-electric', '/works', '/faq']) { const response = await publicPage.goto(`${origin}${path}`); assert.equal(response?.status(), 200, path); assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path); }
    const sitemap = await publicPage.request.get(`${origin}/sitemap.xml`); assert.equal(sitemap.status(), 200); assert.ok((await sitemap.text()).includes('/services/fire-electric'));
    await publicPage.setViewportSize({ width: 1440, height: 1000 }); await publicPage.goto(origin); await publicPage.screenshot({ path: join(dir, 'public-home-desktop.png'), fullPage: true }); assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(publicErrors.length, 0, publicErrors.join('\n')); await publicContext.close(); console.log('PASS public home, menu, sticky CTA, content routes and responsive layout');
    const cleanup = spawn('npm', ['run', 'storage:cleanup'], { env, stdio: 'pipe' });
    let cleanupOutput = '';
    cleanup.stdout.on('data', chunk => { cleanupOutput += chunk.toString(); });
    cleanup.stderr.on('data', chunk => { cleanupOutput += chunk.toString(); });
    const [cleanupCode] = await once(cleanup, 'exit');
    assert.equal(cleanupCode, 0, cleanupOutput);
    console.log('PASS storage cleanup dry run against temporary database and object storage');
  } finally {
    await browser?.close(); await api?.dispose();
    if (proxy) { proxy.closeAllConnections(); await new Promise<void>(r => proxy!.close(() => r())); }
    if (app && app.exitCode === null) { app.kill('SIGTERM'); await once(app, 'exit'); }
    await pool?.end(); if (started) await postgres.stop();
    if (storageStarted) await objectStorage.close();
  }
}
main().catch(error => { console.error(error); process.exit(1); });
