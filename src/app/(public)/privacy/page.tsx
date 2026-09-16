import type { Metadata } from 'next';
import Link from 'next/link';
import { getPrivacyNotice } from '@/lib/privacy';
import { PrivacySummary } from '@/components/contact/privacy-summary';
export const metadata: Metadata = { title: '개인정보 수집·이용 안내', alternates: { canonical: '/privacy' } };
export const dynamic = 'force-dynamic';
export default function PrivacyPage() {
  const notice = getPrivacyNotice();
  return <main className="mx-auto max-w-2xl px-5 py-12"><Link href="/" className="inline-flex min-h-12 items-center text-xl font-black">OK소방</Link><h1 className="mt-7 text-3xl font-bold">개인정보 수집·이용 안내</h1><p className="mt-5 text-sm leading-7 text-slate-600">OK소방은 온라인 상담을 위해 아래 정보를 수집·이용합니다. 상담에 필요한 정보만 입력해주세요.</p><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">{notice ? <><PrivacySummary notice={notice}/><p className="mt-6 text-xs text-slate-500">안내 버전: {notice.version}</p></> : <p className="text-sm leading-7 text-slate-600">상담 접수 안내를 준비하고 있습니다. 안내가 확정되면 온라인 접수를 시작합니다.</p>}</section><Link href="/contact" className="mt-6 inline-flex min-h-12 items-center font-semibold text-red-700">상담접수로 돌아가기 →</Link></main>;
}
