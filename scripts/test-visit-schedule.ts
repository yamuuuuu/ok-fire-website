import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';
import { createPrismaClient } from '../src/lib/prisma-client';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

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
  const { createVisit, updateVisit, changeVisitStatus, listVisits } = await import('../src/services/visit-estimate');
  const { visitUpdateSchema } = await import('../src/validations/visit-estimate');
  const admin = await client.admin.create({ data: { name: '일정 테스트', email: 'visit@example.com', passwordHash: 'test-only', role: 'SUPER_ADMIN' } });
  const inquiry = await client.inquiry.create({ data: { inquiryNumber: 'VISIT-TEST', customerName: '테스트', phone: '01012345678', address: '테스트', description: '테스트', inquiryType: 'REPAIR', privacyAgreed: true, privacyAgreedAt: new Date() } });
  const input = { visitDate: '2026-11-10', visitTime: '14:30', address: '테스트', memo: '삭제 가능한 메모', changeInquiryStatus: true };
  const attempts = await Promise.allSettled(Array.from({ length: 6 }, () => createVisit(String(inquiry.id), String(admin.id), input)));
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1);
  for (const result of attempts) if (result.status === 'rejected') assert.equal(result.reason.code, 'VISIT_ALREADY_EXISTS');
  assert.equal(await client.visit.count({ where: { inquiryId: inquiry.id, deletedAt: null } }), 1);
  const visit = await client.visit.findFirstOrThrow({ where: { inquiryId: inquiry.id } });
  assert.equal(visit.visitDate.toISOString().slice(0, 10), input.visitDate);
  const patch = visitUpdateSchema.parse({ visitDate: '2026-11-12', visitTime: null, memo: null });
  await updateVisit(String(visit.id), String(admin.id), patch);
  const edited = await client.visit.findUniqueOrThrow({ where: { id: visit.id } });
  assert.equal(edited.visitDate.toISOString().slice(0, 10), '2026-11-12'); assert.equal(edited.visitTime, null); assert.equal(edited.memo, null);
  assert.equal((await listVisits({ from: '2026-11-12', to: '2026-11-12' })).items.length, 1);
  await changeVisitStatus(String(visit.id), String(admin.id), 'COMPLETED', true);
  assert.equal((await client.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } })).status, 'VISIT_COMPLETED');
  await assert.rejects(createVisit(String(inquiry.id), String(admin.id), input), { code: 'VISIT_ALREADY_EXISTS' });
  const record = { inquiryId: inquiry.id, createdByAdminId: admin.id, address: '테스트', visitDate: new Date('2026-11-20') };
  await assert.rejects(client.visit.create({ data: record }), { code: 'P2002' });
  console.log('PASS concurrent/repeated creation, database uniqueness, edit in place, nullable fields, exact date and completion');
  const sql = new Client({ connectionString: url }); await sql.connect();
  try {
    await sql.query('DROP INDEX visits_one_per_inquiry');
    const latest = await client.visit.create({ data: record });
    await sql.query(readFileSync('prisma/migrations/20261016000000_single_visit_per_inquiry/migration.sql', 'utf8'));
    const remaining = await client.visit.findMany({ where: { inquiryId: inquiry.id, deletedAt: null } });
    assert.equal(remaining.length, 1); assert.equal(remaining[0].id, latest.id);
    assert.equal(await client.visit.count({ where: { inquiryId: inquiry.id } }), 2);
    assert.equal(await client.adminActivityLog.count({ where: { actionType: 'VISIT_DUPLICATE_ARCHIVED' } }), 1);
    console.log('PASS existing duplicate migration preserves history and keeps latest edit');
  } finally { await sql.end(); }
} finally {
  await client.$disconnect();
  // createInquiry uses the shared application client; close it before removing the test DB.
  const { db } = await import('../src/lib/db'); await db().$disconnect();
  await postgres.stop();
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });
