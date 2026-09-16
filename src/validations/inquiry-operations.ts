import { z } from 'zod';
import { INQUIRY_STATUSES } from '@/lib/admin-inquiry';

const optionalText = (max: number) => z.preprocess(value => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().trim().min(1).max(max).optional());
const databaseId = z.string().regex(/^[1-9]\d{0,18}$/).refine(value => BigInt(value) <= BigInt('9223372036854775807'));

export const statusChangeSchema = z.object({ status: z.enum(INQUIRY_STATUSES), memo: optionalText(500) }).strict();
export const assignmentSchema = z.object({ adminId: z.union([databaseId, z.null()]) }).strict();
export const noteSchema = z.object({ content: z.string().trim().min(1).max(5000) }).strict();
export { databaseId };
