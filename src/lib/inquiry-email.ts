import { z } from 'zod';
import { inquiryTypeLabel, type INQUIRY_TYPES } from './admin-inquiry';

const configSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  INQUIRY_EMAIL_FROM: z.email(),
  INQUIRY_EMAIL_TO: z.email(),
  APP_ORIGIN: z.url().refine(value => new URL(value).protocol === 'https:'),
});

export function emailConfig(env: Record<string, string | undefined> = process.env) {
  if (env.INQUIRY_EMAIL_ENABLED !== 'true') return null;
  const result = configSchema.safeParse(env);
  return result.success ? result.data : null;
}

export function inquiryEmail(inquiry: { id: bigint; inquiryNumber: string; inquiryType: (typeof INQUIRY_TYPES)[number]; createdAt: Date }, config: NonNullable<ReturnType<typeof emailConfig>>) {
  return {
    from: `OK소방 <${config.INQUIRY_EMAIL_FROM}>`,
    to: [config.INQUIRY_EMAIL_TO],
    subject: `[OK소방] 새 상담 접수 ${inquiry.inquiryNumber}`,
    text: [
      '새로운 상담이 접수되었습니다.',
      `접수번호: ${inquiry.inquiryNumber}`,
      `문의유형: ${inquiryTypeLabel[inquiry.inquiryType]}`,
      `접수시간: ${inquiry.createdAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (한국시간)`,
      '',
      `관리자에서 확인: ${new URL(`/admin/inquiries/${inquiry.id}`, config.APP_ORIGIN).href}`,
      '고객 개인정보는 관리자 로그인 및 OTP 인증 후 확인해주세요.',
      '이 메일은 자동 발송되며 회신을 확인하지 않습니다.',
    ].join('\n'),
  };
}

export async function sendInquiryEmail(payload: unknown, key: string, apiKey: string, transport: typeof fetch = fetch) {
  try {
    const response = await transport('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { ok: false as const, code: `HTTP_${response.status}`, retryable: response.status === 429 || response.status >= 500 };
    const body = await response.json();
    if (typeof body.id !== 'string') return { ok: false as const, code: 'INVALID_RESPONSE', retryable: true };
    return { ok: true as const, id: body.id };
  } catch {
    // Never log provider responses, payloads or credentials.
    return { ok: false as const, code: 'NETWORK_ERROR', retryable: true };
  }
}
