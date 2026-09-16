import { z } from 'zod';
import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { getEnv } from '@/lib/env';
import { getPrivacyNotice } from '@/lib/privacy';
import { consumeInquiryLimit } from '@/lib/public-rate-limit';
import { RECEIPT_COOKIE, RECEIPT_SECONDS, signReceipt } from '@/lib/receipt';
import { createInquiry } from '@/services/inquiries';
import { inquiryErrors, inquirySchema } from '@/validations/inquiry';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const notice = getPrivacyNotice();
    if (!notice) throw new ApiError(503, 'SERVICE_UNAVAILABLE', '상담 접수를 준비하고 있습니다. 잠시 후 다시 방문해주세요.');
    const key = z.uuid().safeParse(request.headers.get('idempotency-key'));
    if (!key.success) throw new ApiError(400, 'INVALID_REQUEST', '접수 요청을 다시 시작해주세요.');
    await consumeInquiryLimit(request);
    const parsed = inquirySchema.safeParse(await readJson(request, 32768));
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '입력값을 확인해주세요.', inquiryErrors(parsed.error.issues));
    if (parsed.data.privacyPolicyVersion !== notice.version) throw new ApiError(409, 'PRIVACY_POLICY_UPDATED', '개인정보 안내가 변경되었습니다. 페이지를 새로 열어 확인해주세요.');
    const data = await createInquiry(parsed.data, key.data);
    const response = success(data, 201);
    response.cookies.set(RECEIPT_COOKIE, signReceipt(data.inquiryNumber, getEnv().AUTH_SECRET), {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: RECEIPT_SECONDS,
    });
    return response;
  } catch (error) { return failure(error); }
}
