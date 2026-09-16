import { z } from 'zod';
import { INQUIRY_STATUSES, INQUIRY_TYPES } from '@/lib/admin-inquiry';

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(value => value === '' || value === undefined ? undefined : value, schema.optional());
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00+09:00`);
  return !Number.isNaN(date.valueOf()) && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date) === value;
}

export const adminInquiryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().pipe(z.union([z.literal(20), z.literal(50), z.literal(100)])).default(20),
  status: optional(z.enum(INQUIRY_STATUSES)),
  inquiryType: optional(z.enum(INQUIRY_TYPES)),
  assignedAdminId: optional(z.string().regex(/^[1-9]\d{0,18}$/).refine(value => BigInt(value) <= BigInt('9223372036854775807'))),
  keyword: optional(z.string().trim().min(1).max(100)),
  from: optional(z.string().refine(validDate)),
  to: optional(z.string().refine(validDate)),
  sort: z.enum(['createdAt', 'inquiryNumber', 'customerName', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).strict().superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) context.addIssue({ code: 'custom', path: ['to'], message: '종료일은 시작일 이후여야 합니다.' });
});

export type AdminInquiryQuery = z.infer<typeof adminInquiryQuerySchema>;
export function queryObject(input: URLSearchParams | Record<string, string | string[] | undefined>) {
  if (input instanceof URLSearchParams) return Object.fromEntries(input.entries());
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}
