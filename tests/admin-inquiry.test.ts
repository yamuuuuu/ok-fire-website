import test from 'node:test';
import assert from 'node:assert/strict';
import { adminInquiryQuerySchema, queryObject } from '../src/validations/admin-inquiry';

test('admin inquiry query applies safe pagination and sorting defaults', () => {
  const result = adminInquiryQuerySchema.parse(queryObject(new URLSearchParams()));
  assert.deepEqual(result, { page: 1, pageSize: 20, sort: 'createdAt', order: 'desc' });
  assert.equal(adminInquiryQuerySchema.parse({ page: '2', pageSize: '100' }).pageSize, 100);
});

test('admin inquiry query validates filters, calendar dates and ranges', () => {
  assert.ok(adminInquiryQuerySchema.safeParse({ status: 'NEW', inquiryType: 'REPAIR', assignedAdminId: '12', from: '2026-09-01', to: '2026-09-30' }).success);
  for (const input of [
    { pageSize: '21' }, { status: 'UNKNOWN' }, { assignedAdminId: '0' }, { keyword: 'x'.repeat(101) },
    { from: '2026-02-30' }, { from: '2026-10-02', to: '2026-10-01' }, { assignedAdminId: '9223372036854775808' }, { unexpected: 'value' },
  ]) assert.equal(adminInquiryQuerySchema.safeParse(input).success, false);
});

test('queryObject accepts Next page arrays without widening the query', () => {
  assert.deepEqual(queryObject({ keyword: ['first', 'second'], page: '3', empty: undefined }), { keyword: 'first', page: '3', empty: undefined });
});
