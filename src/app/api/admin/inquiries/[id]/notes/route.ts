import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { createInquiryNote } from '@/services/inquiry-operations';
import { noteSchema } from '@/validations/inquiry-operations';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin();
    const parsed = noteSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '메모는 1~5,000자로 입력해주세요.');
    await createInquiryNote((await context.params).id, admin.id, parsed.data.content);
    return success({ created: true }, 201);
  } catch (error) { return failure(error); }
}
