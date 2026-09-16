import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { updateVisit } from '@/services/visit-estimate';
import { visitUpdateSchema } from '@/validations/visit-estimate';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); const parsed = visitUpdateSchema.safeParse(await readJson(request)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '방문 일정 입력값을 확인해주세요.'); return success(await updateVisit((await context.params).id, admin.id, parsed.data)); } catch (error) { return failure(error); } }
