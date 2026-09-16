import { createHmac, timingSafeEqual } from 'node:crypto';
export const RECEIPT_COOKIE = '__Host-okfire_receipt';
export const RECEIPT_SECONDS = 60 * 30;
const numberPattern = /^OK-\d{8}-\d{4,10}$/;
export function signReceipt(inquiryNumber: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ inquiryNumber, expiresAt: now + RECEIPT_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(`receipt:${payload}`).digest('base64url')}`;
}
export function verifyReceipt(value: string | undefined, secret: string, now = Date.now()): string | null {
  if (!value || value.length > 512) return null;
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  const expected = createHmac('sha256', secret).update(`receipt:${payload}`).digest();
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof data.inquiryNumber === 'string' && numberPattern.test(data.inquiryNumber) && Number.isFinite(data.expiresAt) && data.expiresAt > now ? data.inquiryNumber : null;
  } catch { return null; }
}
