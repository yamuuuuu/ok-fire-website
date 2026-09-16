import type { PrivacyNotice } from '@/lib/privacy';
export function PrivacySummary({ notice }: { notice: PrivacyNotice }) {
  return <dl className="space-y-4 text-sm leading-6 text-slate-600">
    <div><dt className="font-semibold text-slate-900">수집·이용 목적</dt><dd>상담 접수 확인, 고객 연락 및 현장 상담·견적 업무 처리</dd></div>
    <div><dt className="font-semibold text-slate-900">필수 수집 항목</dt><dd>고객명, 연락처, 현장 주소, 문의 유형, 문의 내용</dd></div>
    <div><dt className="font-semibold text-slate-900">선택 수집 항목</dt><dd>업체명·건물명, 우편번호, 상세주소, 희망 연락시간, 공사 희망일, 현장 사진</dd></div>
    <div><dt className="font-semibold text-slate-900">보유·이용 기간</dt><dd>{notice.retention}</dd></div>
    <div><dt className="font-semibold text-slate-900">동의 거부 안내</dt><dd>개인정보 수집·이용 동의를 거부할 수 있습니다. 필수 항목에 동의하지 않으면 온라인 상담을 접수할 수 없습니다. 선택 항목은 입력하지 않아도 접수할 수 있습니다.</dd></div>
    <div><dt className="font-semibold text-slate-900">개인정보 문의</dt><dd>{notice.contact}</dd></div>
  </dl>;
}
