import 'server-only';
import { createHmac } from 'node:crypto';
import { db } from './db';
import { getEnv } from './env';
import { ApiError } from './http';
export async function consumeInquiryLimit(request: Request) {
  const ip = process.env.VERCEL === '1'
    ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown'
    : 'local';
  const key = createHmac('sha256', getEnv().AUTH_SECRET).update(`inquiries:ip:${ip}`).digest('hex');
  const now = new Date(); const expiry = new Date(now.getTime() + 15 * 60 * 1000);
  const rows = await db().$queryRaw<{ count: number }[]>`
    INSERT INTO public_rate_limits (key, count, expires_at) VALUES (${key}, 1, ${expiry})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN public_rate_limits.expires_at <= ${now} THEN 1 ELSE LEAST(public_rate_limits.count + 1, 1000000) END,
      expires_at = CASE WHEN public_rate_limits.expires_at <= ${now} THEN ${expiry} ELSE public_rate_limits.expires_at END
    RETURNING count`;
  if (rows[0].count > 30) throw new ApiError(429, 'RATE_LIMITED', '접수 요청이 많습니다. 15분 후 다시 시도해주세요.');
}
