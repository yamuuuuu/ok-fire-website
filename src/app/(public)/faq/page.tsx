import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { PublicShell } from '@/components/public/public-site';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'OK소방 상담 전 자주 묻는 질문.',
  alternates: { canonical: '/faq' },
};
export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const faqs = await db().faq.findMany({
    where: { published: true, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    select: { id: true, category: true, question: true, answer: true },
  });

  return <PublicShell><main className="bg-slate-50"><section className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
    <p className="text-sm font-bold tracking-widest text-red-700">FAQ</p>
    <h1 className="mt-4 text-4xl font-black sm:text-5xl">자주 묻는 질문</h1>
    <p className="mt-5 text-sm leading-7 text-slate-600">궁금한 질문을 누르면 답변을 확인할 수 있습니다.</p>
    <div className="mt-10 space-y-3">
      {faqs.length ? faqs.map(faq => <details key={faq.id.toString()} className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition open:border-red-200 open:ring-1 open:ring-red-100">
        <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 text-base font-bold leading-7 sm:text-lg">{faq.category && <span className="mr-3 inline-block text-sm text-red-700">{faq.category}</span>}{faq.question}</span>
          <span aria-hidden="true" className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-open:bg-red-700 group-open:text-white">
            <span className="absolute h-0.5 w-4 rounded-full bg-current"/>
            <span className="absolute h-4 w-0.5 rounded-full bg-current transition-transform group-open:rotate-90 group-open:scale-0"/>
          </span>
        </summary>
        <p className="mx-5 whitespace-pre-wrap border-t border-slate-100 py-5 text-sm leading-7 text-slate-600">{faq.answer}</p>
      </details>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">자주 묻는 질문을 준비하고 있습니다.</p>}
    </div>
    <div className="mt-12 rounded-2xl bg-slate-950 p-7 text-white">
      <h2 className="text-xl font-black">답을 찾지 못하셨나요?</h2>
      <p className="mt-3 text-sm text-slate-300">현장 상황을 남겨주시면 확인 후 안내드립니다.</p>
      <Link href="/contact" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-red-700 px-5 text-sm font-bold">간편 상담 접수 →</Link>
    </div>
  </section></main></PublicShell>;
}
