import { requireAdmin } from '@/lib/session';
import Link from 'next/link';
export default async function Dashboard() {
  const admin = await requireAdmin();
  return <><p className="text-sm font-medium text-slate-500">현장 업무의 시작</p><h1 className="mt-2 text-3xl font-bold tracking-tight">관리자 홈</h1><p className="mt-4 leading-7 text-slate-600">{admin.name}님, 로그인되었습니다.</p><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">접수관리 사용 가능</div><h2 className="mt-5 text-xl font-bold">새 상담 접수를 확인하세요.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">고객 연락처, 현장 주소, 문의 내용과 첨부 사진을 모바일에서도 바로 확인할 수 있습니다.</p><Link href="/admin/inquiries" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-red-700 px-5 font-bold text-white">접수 목록 열기</Link></section></>;
}
