import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { createEstimate } from '@/services/visit-estimate';
import { estimateCreateSchema } from '@/validations/visit-estimate';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); const parsed = estimateCreateSchema.safeParse(await readJson(request)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '견적 입력값을 확인해주세요.'); return success(await createEstimate((await context.params).id, admin.id, parsed.data), 201); } catch (error) { return failure(error); } }
