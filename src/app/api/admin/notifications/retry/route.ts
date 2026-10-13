import { db } from '@/lib/db';
import { failure, requireSameOrigin, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { dispatchInquiryEmails } from '@/services/inquiry-email-worker';

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const admin = await requireAdmin('SUPER_ADMIN');
    await db().adminActivityLog.create({ data: { adminId: BigInt(admin.id), actionType: 'EMAIL_RETRY', targetType: 'NOTIFICATION' } });
    await db().inquiryEmail.updateMany({ where: { status: 'FAILED' }, data: { status: 'PENDING', nextAttemptAt: new Date() } });
    return success(await dispatchInquiryEmails(db()));
  } catch (error) { return failure(error); }
}
