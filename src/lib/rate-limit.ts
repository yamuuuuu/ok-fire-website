import 'server-only';
import { createHmac } from 'node:crypto';
import { db } from './db';
import { getEnv } from './env';
import { ApiError } from './http';
const WINDOW_MS = 15 * 60 * 1000;
export async function consumeLoginLimit(email: string, request: Request) {
  // Vercel overwrites x-vercel-forwarded-for. Never trust client x-forwarded-for.
  const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown' : 'local';
  const now = new Date(); const expiry = new Date(now.getTime() + WINDOW_MS);
  const buckets = [{ value: `email:${email}`, max: 10 }, { value: `ip:${ip}`, max: 100 }];
  for (const bucket of buckets) {
    const key = createHmac('sha256', getEnv().AUTH_SECRET).update(bucket.value).digest('hex');
    const rows = await db().$queryRaw<{ count: number }[]>`
      INSERT INTO auth_rate_limits (key, count, expires_at) VALUES (${key}, 1, ${expiry})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN auth_rate_limits.expires_at <= ${now} THEN 1 ELSE LEAST(auth_rate_limits.count + 1, 1000000) END,
        expires_at = CASE WHEN auth_rate_limits.expires_at <= ${now} THEN ${expiry} ELSE auth_rate_limits.expires_at END
      RETURNING count`;
    if (rows[0].count > bucket.max) throw new ApiError(429, 'RATE_LIMITED', '로그인 시도가 많습니다. 15분 후 다시 시도해주세요.');
  }
}
