import Link from 'next/link';
export default function InquiryNotFound() {
  return <section className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-bold">접수를 찾을 수 없습니다.</h1><p className="mt-3 text-sm text-slate-600">삭제되었거나 존재하지 않는 접수입니다.</p><Link href="/admin/inquiries" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-slate-900 px-5 font-bold text-white">접수목록으로</Link></section>;
}
