import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { deleteInquiryNote, updateInquiryNote } from '@/services/inquiry-operations';
import { noteSchema } from '@/validations/inquiry-operations';

export async function PATCH(request: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin(); const params = await context.params;
    const parsed = noteSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '메모는 1~5,000자로 입력해주세요.');
    await updateInquiryNote(params.id, params.noteId, admin.id, admin.role, parsed.data.content);
    return success({ updated: true });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin(); const params = await context.params;
    await deleteInquiryNote(params.id, params.noteId, admin.id, admin.role);
    return success({ deleted: true });
  } catch (error) { return failure(error); }
}
