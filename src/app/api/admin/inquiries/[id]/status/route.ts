import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { changeInquiryStatus } from '@/services/inquiry-operations';
import { statusChangeSchema } from '@/validations/inquiry-operations';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const parsed = statusChangeSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '상태와 메모를 확인해주세요.');
    return success(await changeInquiryStatus((await context.params).id, admin.id, parsed.data.status, parsed.data.memo));
  } catch (error) { return failure(error); }
}
