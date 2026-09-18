import { ApiError, failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { listAdminInquiries } from '@/services/admin-inquiries';
import { adminInquiryQuerySchema, queryObject } from '@/validations/admin-inquiry';

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = adminInquiryQuerySchema.safeParse(queryObject(new URL(request.url).searchParams));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '검색 조건을 확인해주세요.');
    return success(await listAdminInquiries(parsed.data, admin));
  } catch (error) { return failure(error); }
}
