import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { changeVisitStatus } from '@/services/visit-estimate';
import { visitStatusSchema } from '@/validations/visit-estimate';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); const parsed = visitStatusSchema.safeParse(await readJson(request)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '방문 상태를 확인해주세요.'); return success(await changeVisitStatus((await context.params).id, admin.id, parsed.data.status, parsed.data.changeInquiryStatus)); } catch (error) { return failure(error); } }
