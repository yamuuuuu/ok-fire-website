export const INQUIRY_STATUSES = ['NEW', 'CONFIRMED', 'CONSULTING', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'ESTIMATING', 'WORKING', 'COMPLETED', 'ON_HOLD', 'CANCELED'] as const;
export const INQUIRY_TYPES = ['FIRE_ELECTRIC', 'FIRE_CONSTRUCTION', 'FIRE_INSPECTION', 'REPAIR', 'ESTIMATE', 'ETC'] as const;

export const statusLabel: Record<(typeof INQUIRY_STATUSES)[number], string> = {
  NEW: '신규접수', CONFIRMED: '확인완료', CONSULTING: '상담중', VISIT_SCHEDULED: '방문예정',
  VISIT_COMPLETED: '현장확인완료', ESTIMATING: '견적진행', WORKING: '공사진행', COMPLETED: '완료',
  ON_HOLD: '보류', CANCELED: '취소',
};
export const inquiryTypeLabel: Record<(typeof INQUIRY_TYPES)[number], string> = {
  FIRE_ELECTRIC: '소방전기', FIRE_CONSTRUCTION: '소방설비 시공', FIRE_INSPECTION: '소방점검',
  REPAIR: '수리/보수', ESTIMATE: '견적 문의', ETC: '기타',
};
export const preferredContactLabel: Record<string, string> = {
  ANYTIME: '언제든 가능', MORNING: '오전', AFTERNOON: '오후', CUSTOM: '직접 입력',
};

const koreaDateTime = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const koreaDate = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
export function formatDateTime(value: string | Date) { return koreaDateTime.format(new Date(value)); }
export function formatDate(value: string | Date) { return koreaDate.format(new Date(value)); }
export function displayPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}
export function phoneHref(phone: string) { return `tel:${phone.replace(/[^+\d]/g, '')}`; }
export function fullAddress(address: string, detail?: string | null) { return [address, detail].filter(Boolean).join(' '); }

export function statusTone(status: string) {
  if (status === 'NEW') return 'bg-red-50 text-red-800 ring-red-200';
  if (['COMPLETED', 'CONFIRMED'].includes(status)) return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  if (['CANCELED', 'ON_HOLD'].includes(status)) return 'bg-slate-100 text-slate-700 ring-slate-200';
  return 'bg-amber-50 text-amber-900 ring-amber-200';
}
