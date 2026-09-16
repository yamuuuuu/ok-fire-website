import type { Metadata } from 'next';
import Link from 'next/link';
import { getPrivacyNotice } from '@/lib/privacy';
import { ContactForm } from '@/components/contact/contact-form';
export const metadata: Metadata = { title: '간편 상담 접수', description: '현장 상황을 알려주세요. OK소방이 확인 후 상담을 도와드립니다.', alternates: { canonical: '/contact' } };
export const dynamic = 'force-dynamic';
export default function ContactPage() {
  const notice = getPrivacyNotice();
  return <div className="min-h-dvh bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/" className="py-2 text-xl font-black">OK<span className="text-red-700">소방</span></Link><span className="text-xs font-medium text-slate-500">30년 현장 경험</span></div></header>
    <main className="mx-auto max-w-2xl px-5 pt-9 pb-32 sm:pt-12">
      <p className="text-xs font-bold tracking-widest text-red-700">현장을 아는 전문가에게</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">간편 상담 접수</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">현장 상황을 알려주세요.<br className="sm:hidden"/> 내용을 확인한 후 연락드리겠습니다.</p>
      {notice ? <ContactForm notice={notice}/> : <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">상담 접수를 준비하고 있습니다.</h2><p className="mt-3 text-sm leading-7 text-slate-600">서비스 준비가 끝나면 온라인으로 접수하실 수 있습니다.</p><Link href="/" className="mt-6 inline-flex min-h-12 items-center font-semibold text-red-700">홈으로 돌아가기 →</Link></section>}
    </main>
  </div>;
}
