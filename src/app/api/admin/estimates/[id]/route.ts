import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { deleteEstimate, updateEstimate } from '@/services/visit-estimate';
import { estimateUpdateSchema } from '@/validations/visit-estimate';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); const parsed = estimateUpdateSchema.safeParse(await readJson(request)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '견적 입력값을 확인해주세요.'); return success(await updateEstimate((await context.params).id, admin.id, parsed.data)); } catch (error) { return failure(error); } }
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); return success(await deleteEstimate((await context.params).id, admin.id)); } catch (error) { return failure(error); } }
