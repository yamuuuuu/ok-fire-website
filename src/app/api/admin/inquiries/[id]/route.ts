import { failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { getAdminInquiryDetail } from '@/services/admin-inquiries';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    return success(await getAdminInquiryDetail((await context.params).id, admin));
  } catch (error) { return failure(error); }
}
