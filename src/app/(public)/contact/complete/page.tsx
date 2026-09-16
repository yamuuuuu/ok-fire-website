import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEnv } from '@/lib/env';
import { RECEIPT_COOKIE, verifyReceipt } from '@/lib/receipt';
export const metadata: Metadata = { title: '상담 접수 완료', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function CompletePage() {
  const cookie = (await cookies()).get(RECEIPT_COOKIE)?.value;
  if (!cookie) redirect('/contact');
  const inquiryNumber = verifyReceipt(cookie, getEnv().AUTH_SECRET);
  if (!inquiryNumber) redirect('/contact');
  return <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-12"><section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10"><span aria-hidden="true" className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-700">✓</span><h1 className="mt-7 text-2xl leading-9 font-bold">상담 접수가<br/>완료되었습니다.</h1><p className="mt-4 text-sm leading-7 text-slate-600">접수 내용을 확인한 후<br/>남겨주신 연락처로 연락드리겠습니다.</p><div className="my-7 rounded-xl bg-slate-50 px-3 py-5"><p className="text-xs text-slate-500">접수번호</p><p className="mt-2 font-mono text-xl font-bold tracking-tight">{inquiryNumber}</p></div><p className="mb-7 text-xs leading-6 text-slate-500">접수번호를 따로 보관해주세요.<br/>이 화면에서는 고객 개인정보가 표시되지 않습니다.</p><Link href="/" className="flex min-h-14 items-center justify-center rounded-xl bg-red-700 font-bold text-white">홈으로</Link><Link href="/contact" className="mt-3 flex min-h-12 items-center justify-center text-sm font-semibold text-slate-600">다른 현장 상담 접수</Link></section></main>;
}
