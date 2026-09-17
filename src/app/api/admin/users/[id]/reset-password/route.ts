import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { resetPassword } from '@/services/cms';
import { passwordResetSchema } from '@/validations/cms';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin('SUPER_ADMIN');
    const parsed = passwordResetSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '비밀번호는 10~128자로 입력해주세요.');
    return success(await resetPassword((await context.params).id, admin.id, parsed.data.password));
  } catch (error) { return failure(error); }
}
