import 'server-only';
import { createHmac, createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { getEnv } from '@/lib/env';
import { ApiError } from '@/lib/http';
import type { InquiryInput } from '@/validations/inquiry';

export async function createInquiry(input: InquiryInput, requestKey: string) {
  const submissionKeyHash = createHash('sha256').update(requestKey).digest('hex');
  const submissionPayloadHash = createHmac('sha256', getEnv().AUTH_SECRET).update(`inquiry:${JSON.stringify(input)}`).digest('hex');
  return db().$transaction(async tx => {
    // Serialize requests with the same key before allocating a number. Other keys run independently.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${submissionKeyHash}, 0))`;
    const existing = await tx.inquiry.findUnique({ where: { submissionKeyHash }, select: {
      id: true, inquiryNumber: true, createdAt: true, submissionPayloadHash: true, deletedAt: true,
    } });
    if (existing) {
      if (existing.submissionPayloadHash !== submissionPayloadHash || existing.deletedAt) {
        throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', '이미 처리된 접수 요청입니다. 입력 내용을 확인하거나 새 접수를 시작해주세요.');
      }
      return { id: existing.id.toString(), inquiryNumber: existing.inquiryNumber, status: 'NEW' as const, createdAt: existing.createdAt.toISOString() };
    }
    const [counter] = await tx.$queryRaw<{ day: string; value: number }[]>`
      INSERT INTO inquiry_counters (day, value)
      VALUES (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul', 'YYYYMMDD'), 1)
      ON CONFLICT (day) DO UPDATE SET value = inquiry_counters.value + 1
      RETURNING day, value`;
    const { preferredWorkDate, ...fields } = input;
    const inquiry = await tx.inquiry.create({ data: {
      ...fields, preferredWorkDate: preferredWorkDate ? new Date(`${preferredWorkDate}T00:00:00.000Z`) : null,
      inquiryNumber: `OK-${counter.day}-${String(counter.value).padStart(4, '0')}`,
      submissionKeyHash, submissionPayloadHash, status: 'NEW', source: 'WEB', privacyAgreedAt: new Date(),
      inquiryStatusHistoriesByInquiryId: { create: { previousStatus: null, newStatus: 'NEW', changedByAdminId: null } },
    }, select: { id: true, inquiryNumber: true, createdAt: true } });
    return { id: inquiry.id.toString(), inquiryNumber: inquiry.inquiryNumber, status: 'NEW' as const, createdAt: inquiry.createdAt.toISOString() };
  }, { maxWait: 10000, timeout: 10000 });
}
