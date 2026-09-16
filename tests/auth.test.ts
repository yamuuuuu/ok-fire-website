import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from '../src/lib/password';
import { loginSchema, seedSchema } from '../src/validations/auth';
import { hasRole } from '../src/lib/authorization';
import { ApiError, readJson, requireSameOrigin } from '../src/lib/http';
test('password hashing salts independently and rejects incorrect or malformed credentials', async () => {
  const password = 'integration-unit-password';
  const [first, second] = await Promise.all([hashPassword(password), hashPassword(password)]);
  assert.notEqual(first, second); assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password + 'wrong', first), false);
  assert.equal(await verifyPassword(password, 'scrypt$broken'), false);
  assert.equal(await verifyPassword(password, DUMMY_PASSWORD_HASH), false);
});
test('login normalizes email, never password, and rejects excessive input', () => {
  assert.deepEqual(loginSchema.parse({ email: ' Admin@Example.com ', password: ' keep spaces ' }), { email: 'admin@example.com', password: ' keep spaces ' });
  for (const value of [{ email: 'invalid', password: 'x' }, { email: 'a@example.com', password: 'x'.repeat(129) }, { email: 'a@example.com', password: 'x', role: 'SUPER_ADMIN' }]) assert.equal(loginSchema.safeParse(value).success, false);
  assert.equal(seedSchema.safeParse({ SEED_ADMIN_NAME: '관리자', SEED_ADMIN_EMAIL: 'admin@example.com', SEED_ADMIN_PASSWORD: 'short' }).success, false);
});
test('manager cannot access SUPER_ADMIN-only operations', () => {
  assert.equal(hasRole('MANAGER', 'SUPER_ADMIN'), false);
  assert.equal(hasRole('SUPER_ADMIN', 'SUPER_ADMIN'), true);
});
test('JSON body limit is enforced even without a Content-Length', async () => {
  await assert.rejects(readJson(new Request('https://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(9000) }) })), (err: unknown) => err instanceof ApiError && err.status === 413);
  await assert.rejects(readJson(new Request('https://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })), (err: unknown) => err instanceof ApiError && err.status === 400);
});
test('CSRF rejects missing and foreign origins', () => {
  const previous = { ...process.env };
  process.env.DATABASE_URL = 'postgresql://localhost/test'; process.env.AUTH_SECRET = 'a'.repeat(64); process.env.APP_ORIGIN = 'https://localhost:3443';
  try {
    for (const origin of ['', 'https://evil.example']) assert.throws(() => requireSameOrigin(new Request('https://localhost:3443/api/admin/auth/logout', { headers: { origin } })), (err: unknown) => err instanceof ApiError && err.status === 403);
    assert.doesNotThrow(() => requireSameOrigin(new Request('https://localhost:3443/api/admin/auth/logout', { headers: { origin: 'https://localhost:3443' } })));
  } finally { process.env = previous; }
});
