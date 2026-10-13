import { requireAdmin } from '@/lib/session';
import { listSettings } from '@/services/cms';
import { SettingsEditor } from '@/components/admin/settings-editor';
import { EmailRetryButton } from '@/components/admin/email-retry-button';
import { db } from '@/lib/db';
import { emailConfig } from '@/lib/inquiry-email';
export const dynamic = 'force-dynamic';

export default async function Settings() {
  const admin = await requireAdmin('SUPER_ADMIN');
  const config = emailConfig();
  const counts = await db().inquiryEmail.groupBy({ by: ['status'], _count: true });
  const labels: Record<string, string> = { PENDING: '전송 대기', PROCESSING: '전송 중', SENT: '발송 요청 성공', FAILED: '발송 실패', REVIEW: '수동 확인 필요', CANCELED: '취소' };
  return <div><p className="text-sm text-slate-500">최고 관리자</p><h1 className="mt-2 text-3xl font-bold">사이트 설정</h1><div className="mt-6 max-w-3xl">
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">상담 접수 이메일 알림</h2>
      <p className="mt-2 break-all text-sm text-slate-600">{config ? `사용 중 · ${config.INQUIRY_EMAIL_TO}` : '사용 안 함 · 발신 도메인 인증과 운영 환경변수 설정이 필요합니다.'}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">접수번호·문의유형·시간과 관리자 링크만 발송합니다. 고객 연락처와 문의 내용은 메일에 포함하지 않습니다.</p>
      <ul className="mt-3 flex flex-wrap gap-3 text-sm">{counts.map(row => <li key={row.status}>{labels[row.status] ?? row.status}: {row._count}건</li>)}</ul>
      <p className="mt-3 text-xs leading-5 text-slate-500">발송 요청 성공은 받은편지함 도착을 의미하지 않습니다. 실패 시 설정 확인 후 재시도하세요. 최초 시도 후 23시간이 지나면 중복 발송 방지를 위해 자동 재전송을 중단합니다. 수동 확인 건은 Resend의 발송 이력을 확인해주세요.</p>
      {config && <EmailRetryButton />}
    </section>
    <SettingsEditor items={await listSettings()} adminId={admin.id}/>
  </div></div>;
}
