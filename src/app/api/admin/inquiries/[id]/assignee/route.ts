import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { changeInquiryAssignee } from '@/services/inquiry-operations';
import { assignmentSchema } from '@/validations/inquiry-operations';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const parsed = assignmentSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '담당자를 확인해주세요.');
    return success(await changeInquiryAssignee((await context.params).id, admin.id, parsed.data.adminId));
  } catch (error) { return failure(error); }
}
