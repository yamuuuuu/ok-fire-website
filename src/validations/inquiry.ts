import { z } from 'zod';

export const inquiryTypes = [
  { value: 'FIRE_ELECTRIC', label: '소방전기', description: '감지기 · 수신기 · 유도등' },
  { value: 'FIRE_CONSTRUCTION', label: '소방설비 시공', description: '신축 · 증축 · 시설 공사' },
  { value: 'FIRE_INSPECTION', label: '소방점검', description: '소방시설 점검 상담' },
  { value: 'REPAIR', label: '수리/보수', description: '고장 수리 · 시설 유지관리' },
  { value: 'ESTIMATE', label: '견적 문의', description: '공사 범위와 비용 상담' },
  { value: 'ETC', label: '기타', description: '어떤 서비스인지 몰라도 괜찮아요' },
] as const;
export const contactTimes = [
  { value: 'ANYTIME', label: '언제든지' }, { value: 'MORNING', label: '오전' },
  { value: 'AFTERNOON', label: '오후' }, { value: 'CUSTOM', label: '직접 입력' },
] as const;
const optionalText = (max: number) => z.string().trim().max(max, `최대 ${max}자까지 입력해주세요.`).nullish().transform(value => value || null);
export const inquirySchema = z.object({
  inquiryType: z.enum(inquiryTypes.map(item => item.value), { error: '문의 유형을 선택해주세요.' }),
  customerName: z.string().trim().min(1, '이름을 입력해주세요.').max(50, '이름은 50자까지 입력해주세요.'),
  phone: z.string().trim().max(30, '연락처를 확인해주세요.').transform(value => value.replace(/[\s()-]/g, '').replace(/^\+82/, '0')).pipe(z.string().regex(/^0[1-9]\d{7,10}$/, '연락 가능한 국내 전화번호를 입력해주세요.')),
  companyName: optionalText(100),
  address: z.string().trim().min(1, '현장 주소를 입력해주세요.').max(255, '주소는 255자까지 입력해주세요.'),
  addressDetail: optionalText(255),
  description: z.string().trim().min(1, '문의 내용을 입력해주세요.').max(5000, '문의 내용은 5,000자까지 입력해주세요.'),
  preferredContactTime: z.enum(contactTimes.map(item => item.value)).nullish().transform(value => value ?? null),
  preferredContactDetail: optionalText(100),
  preferredWorkDate: z.union([z.iso.date({ error: '올바른 날짜를 선택해주세요.' }), z.literal('')]).nullish().transform(value => value || null),
  privacyAgreed: z.boolean().refine(value => value, '개인정보 수집·이용에 동의해주세요.'),
  privacyPolicyVersion: z.string().trim().min(1, '개인정보 안내를 다시 확인해주세요.').max(100),
}).strict().superRefine((value, context) => {
  if (value.preferredContactTime === 'CUSTOM' && !value.preferredContactDetail) {
    context.addIssue({ code: 'custom', path: ['preferredContactDetail'], message: '희망 연락시간을 입력해주세요.' });
  }
}).transform(value => ({ ...value, preferredContactDetail: value.preferredContactTime === 'CUSTOM' ? value.preferredContactDetail : null }));

export type InquiryInput = z.output<typeof inquirySchema>;
export type InquiryDraft = {
  inquiryType: string; customerName: string; phone: string; companyName: string;
  address: string; addressDetail: string; description: string;
  preferredContactTime: string; preferredContactDetail: string; preferredWorkDate: string;
  privacyAgreed: boolean; privacyPolicyVersion: string;
};
export const stepFields: (keyof InquiryDraft)[][] = [
  ['inquiryType'], ['address', 'addressDetail', 'companyName'],
  ['description', 'preferredWorkDate'], ['customerName', 'phone', 'preferredContactTime', 'preferredContactDetail'],
  ['privacyAgreed', 'privacyPolicyVersion'],
];
export function inquiryErrors(issues: z.core.$ZodIssue[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}
