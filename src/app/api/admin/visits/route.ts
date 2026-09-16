import { ApiError, failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { listVisits } from '@/services/visit-estimate';
import { z } from 'zod';
const query = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELED']).optional(), assignedAdminId: z.string().regex(/^[1-9]\d*$/).optional() }).refine(value => !value.from || !value.to || value.from <= value.to);
export async function GET(request: Request) { try { await requireAdmin(); const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '일정 검색 조건을 확인해주세요.'); return success(await listVisits(parsed.data)); } catch (error) { return failure(error); } }
