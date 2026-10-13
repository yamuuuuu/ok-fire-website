import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';
import { createPrismaClient } from '../src/lib/prisma-client';
import { dispatchInquiryEmails } from '../src/services/inquiry-email-worker';

async function main() {
const socket = createServer().listen(0, '127.0.0.1');
await once(socket, 'listening'); const address = socket.address(); assert.ok(address && typeof address !== 'string');
const port = address.port; await new Promise<void>(resolve => socket.close(() => resolve()));
const dir = await mkdtemp(join(tmpdir(), 'okfire-email-test-'));
const postgres = new EmbeddedPostgres({ databaseDir: join(dir, 'pg'), user: 'postgres', password: 'isolated-test-only', port, persistent: false, authMethod: 'scram-sha-256', postgresFlags: ['-h', '127.0.0.1', '-k', dir], onLog: () => {}, onError: () => {} });
const url = `postgresql://postgres:isolated-test-only@127.0.0.1:${port}/okfire`;
const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url, AUTH_SECRET: 'a'.repeat(64), APP_ORIGIN: 'https://example.com', INQUIRY_EMAIL_ENABLED: 'true', RESEND_API_KEY: 'test-only', INQUIRY_EMAIL_FROM: 'notifications@mail.example.com', INQUIRY_EMAIL_TO: 'owner@example.com' };
const client = createPrismaClient(url);
try {
  await postgres.initialise(); await postgres.start(); await postgres.createDatabase('okfire');
  const migration = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { env, encoding: 'utf8' });
  assert.equal(migration.status, 0, migration.stderr);
  Object.assign(process.env, env);
  const { createInquiry } = await import('../src/services/inquiries');
  const input = { inquiryType: 'REPAIR' as const, customerName: '테스트', phone: '01012345678', companyName: null, address: '테스트 주소', addressDetail: null, description: '테스트', preferredContactTime: null, preferredContactDetail: null, preferredWorkDate: null, privacyAgreed: true, privacyPolicyVersion: 'test-only' };
  const [first, replay] = await Promise.all([createInquiry(input, 'same-test-key'), createInquiry(input, 'same-test-key')]);
  assert.equal(first.id, replay.id);
  assert.equal(await client.inquiryEmail.count(), 1);
  let calls = 0;
  const transport: typeof fetch = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 30)); return Response.json({ id: 'mail-test' }); };
  await Promise.all([dispatchInquiryEmails(client, { env, transport }), dispatchInquiryEmails(client, { env, transport })]);
  assert.equal(calls, 1); assert.equal((await client.inquiryEmail.findFirst())?.status, 'SENT');
  await dispatchInquiryEmails(client, { env, transport }); assert.equal(calls, 1);
  console.log('PASS atomic enqueue, duplicate submission and concurrent worker protection');
  const failed = await createInquiry(input, 'failure-test-key');
  const id = BigInt(failed.id);
  await dispatchInquiryEmails(client, { env, inquiryId: id, transport: async () => { throw new Error('provider unavailable'); } });
  assert.ok(await client.inquiry.findUnique({ where: { id } }));
  assert.equal((await client.inquiryEmail.findUnique({ where: { inquiryId: id } }))?.status, 'PENDING');
  await client.inquiryEmail.update({ where: { inquiryId: id }, data: { nextAttemptAt: new Date(0) } });
  await dispatchInquiryEmails(client, { env, transport });
  assert.equal((await client.inquiryEmail.findUnique({ where: { inquiryId: id } }))?.status, 'SENT');
  console.log('PASS saved inquiry survives mail failure and retry succeeds');
  const stale = await createInquiry(input, 'stale-test-key');
  await client.inquiryEmail.update({ where: { inquiryId: BigInt(stale.id) }, data: { firstAttemptAt: new Date(Date.now() - 24 * 3600000), status: 'PROCESSING', leaseUntil: new Date(0) } });
  const before = calls;
  await dispatchInquiryEmails(client, { env, transport }); assert.equal(calls, before);
  assert.equal((await client.inquiryEmail.findUnique({ where: { inquiryId: BigInt(stale.id) } }))?.status, 'REVIEW');
  const deleted = await createInquiry(input, 'deleted-test-key');
  await client.inquiry.update({ where: { id: BigInt(deleted.id) }, data: { deletedAt: new Date() } });
  await dispatchInquiryEmails(client, { env, transport }); assert.equal(calls, before);
  console.log('PASS expired idempotency window and deleted inquiry never send');
} finally {
  await client.$disconnect();
  // createInquiry uses the shared application client; close it before removing the test DB.
  const { db } = await import('../src/lib/db'); await db().$disconnect();
  await postgres.stop();
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });
