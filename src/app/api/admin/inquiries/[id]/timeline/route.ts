import { failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { inquiryTimeline } from '@/services/inquiry-operations';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); return success(await inquiryTimeline((await context.params).id)); }
  catch (error) { return failure(error); }
}
