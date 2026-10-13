import type { PrismaClient } from '@/generated/prisma/client';
import { emailConfig, sendInquiryEmail } from '@/lib/inquiry-email';

// Injectable dependencies allow real PostgreSQL concurrency tests without sending mail.
export async function dispatchInquiryEmails(client: PrismaClient, options: { inquiryId?: bigint; limit?: number; transport?: typeof fetch; env?: NodeJS.ProcessEnv } = {}) {
  const config = emailConfig(options.env);
  if (!config) return { processed: 0 };
  const now = new Date();
  const candidates = await client.inquiryEmail.findMany({
    where: { inquiryId: options.inquiryId, status: { in: ['PENDING', 'PROCESSING'] }, nextAttemptAt: { lte: now }, OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] },
    orderBy: { createdAt: 'asc' }, take: Math.min(options.limit ?? 5, 5),
  });
  let processed = 0;
  for (const row of candidates) {
    const leaseUntil = new Date(Date.now() + 60000);
    const claim = await client.inquiryEmail.updateMany({ where: { id: row.id, status: row.status, attempts: row.attempts, OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }] }, data: { status: 'PROCESSING', leaseUntil, attempts: { increment: 1 }, firstAttemptAt: row.firstAttemptAt ?? new Date() } });
    if (!claim.count) continue;
    processed++;
    const finish = (data: Parameters<typeof client.inquiryEmail.updateMany>[0]['data']) => client.inquiryEmail.updateMany({ where: { id: row.id, status: 'PROCESSING', leaseUntil }, data: { ...data, leaseUntil: null } });
    const inquiry = await client.inquiry.findUnique({ where: { id: row.inquiryId }, select: { deletedAt: true } });
    if (!inquiry || inquiry.deletedAt) { await finish({ status: 'CANCELED' }); continue; }
    // Provider deduplication expires after 24h. Stop before that boundary, including crashed leases.
    if ((row.firstAttemptAt && Date.now() - row.firstAttemptAt.getTime() >= 23 * 60 * 60 * 1000) || row.attempts >= 8) {
      await finish({ status: 'REVIEW', errorCode: 'RETRY_WINDOW_EXPIRED' }); continue;
    }
    const result = await sendInquiryEmail(row.payload, `inquiry/${row.id}`, config.RESEND_API_KEY, options.transport);
    if (result.ok) await finish({ status: 'SENT', providerId: result.id, sentAt: new Date(), errorCode: null });
    else await finish({ status: result.retryable ? 'PENDING' : 'FAILED', errorCode: result.code, nextAttemptAt: new Date(Date.now() + Math.min(60 * 60, 60 * 2 ** row.attempts) * 1000) });
  }
  return { processed };
}
