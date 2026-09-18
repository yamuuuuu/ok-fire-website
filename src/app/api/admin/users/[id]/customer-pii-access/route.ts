import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { setCustomerPiiAccess } from '@/services/cms';
import { z } from 'zod';

const schema = z.object({ enabled: z.boolean() }).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin('SUPER_ADMIN');
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '개인정보 열람 권한 값을 확인해주세요.');
    return success(await setCustomerPiiAccess((await context.params).id, admin.id, parsed.data.enabled));
  } catch (error) { return failure(error); }
}
