import { z } from 'zod';
const schema = z.object({
  STORAGE_ENDPOINT: z.url(), STORAGE_REGION: z.string().min(1), STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1), STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
});
export function storageConfig() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) return null;
  const url = new URL(parsed.data.STORAGE_ENDPOINT);
  if (url.username || url.password || url.search || url.hash) return null;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local && process.env.VERCEL !== '1')) return null;
  return parsed.data;
}
