import { z } from 'zod';
const schema = z.object({
  DATABASE_URL: z.string().url().refine(v => /^postgres(ql)?:/.test(v)),
  APP_ORIGIN: z.string().url().refine(v => new URL(v).origin === v, 'Use an origin without a path or trailing slash'),
  AUTH_SECRET: z.string().min(64),
});
export function getEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new Error('Required server environment is missing or invalid');
  if (process.env.NODE_ENV === 'production' && !result.data.APP_ORIGIN.startsWith('https://')) {
    throw new Error('Production APP_ORIGIN must use HTTPS');
  }
  return result.data;
}
