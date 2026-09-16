import test from 'node:test';
import assert from 'node:assert/strict';
import { inquirySchema, inquiryErrors } from '../src/validations/inquiry';
import { signReceipt, verifyReceipt, RECEIPT_SECONDS } from '../src/lib/receipt';
const valid = {
  inquiryType: 'FIRE_ELECTRIC', customerName: ' 테스트 고객 ', phone: '010-1234-5678',
  address: ' 서울시 테스트로 123 ', description: ' 유도등 점검 문의 ',
  privacyAgreed: true, privacyPolicyVersion: 'test-v1',
};
test('inquiry normalizes phone and optional values without requiring company or date', () => {
  const result = inquirySchema.parse(valid);
  assert.equal(result.customerName, '테스트 고객'); assert.equal(result.phone, '01012345678');
  assert.equal(result.companyName, null); assert.equal(result.preferredWorkDate, null);
  assert.equal(result.address, '서울시 테스트로 123');
  assert.equal(inquirySchema.parse({ ...valid, phone: '+82 10-1234-5678' }).phone, '01012345678');
  assert.equal(inquirySchema.parse({ ...valid, phone: '02-123-4567' }).phone, '021234567');
});
test('rejects missing consent, whitespace fields, invalid phone and privileged fields', () => {
  for (const change of [{ privacyAgreed: false }, { privacyAgreed: 'true' }, { customerName: '  ' }, { address: '  ' }, { phone: 'abc01012345678' }, { inquiryType: 'INVALID' }, { status: 'COMPLETED' }, { assignedAdminId: '1' }, { description: 'x'.repeat(5001) }]) {
    assert.equal(inquirySchema.safeParse({ ...valid, ...change }).success, false, JSON.stringify(change).slice(0, 80));
  }
});
test('custom contact detail is validated even before consent; irrelevant detail is discarded', () => {
  const result = inquirySchema.safeParse({ ...valid, privacyAgreed: false, preferredContactTime: 'CUSTOM', preferredContactDetail: ' ' });
  assert.equal(result.success, false);
  if (!result.success) assert.ok(inquiryErrors(result.error.issues).preferredContactDetail);
  assert.equal(inquirySchema.parse({ ...valid, preferredContactTime: 'MORNING', preferredContactDetail: 'old choice' }).preferredContactDetail, null);
});
test('validates calendar dates including leap years and optional postal code', () => {
  for (const date of ['2026-02-29', '2026-13-01', '2026-04-31', '2026-09-15T12:00:00Z']) assert.equal(inquirySchema.safeParse({ ...valid, preferredWorkDate: date }).success, false);
  assert.equal(inquirySchema.parse({ ...valid, preferredWorkDate: '2028-02-29', postalCode: '01234' }).preferredWorkDate, '2028-02-29');
  assert.equal(inquirySchema.safeParse({ ...valid, postalCode: '123456' }).success, false);
});
test('receipt resists forgery, expiry and cross-secret reuse', () => {
  const secret = 'a'.repeat(64); const now = Date.now();
  const receipt = signReceipt('OK-20260915-0001', secret, now);
  assert.equal(verifyReceipt(receipt, secret, now), 'OK-20260915-0001');
  assert.equal(verifyReceipt(receipt, secret, now + RECEIPT_SECONDS * 1000), null);
  assert.equal(verifyReceipt(receipt, 'b'.repeat(64), now), null);
  assert.equal(verifyReceipt(`invalid.${receipt.split('.')[1]}`, secret, now), null);
  assert.equal(verifyReceipt(receipt + '.extra', secret, now), null);
  assert.equal(verifyReceipt(undefined, secret, now), null);
});
