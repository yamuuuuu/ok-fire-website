import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { PublicShell } from '@/components/public/public-site';
import { VisualIcon } from '@/components/public/visual-icon';
import { inquiryTypeLabel } from '@/lib/admin-inquiry';

export const metadata: Metadata = {
  title: '작업사례',
  description: 'OK소방의 공개 작업사례입니다.',
  alternates: { canonical: '/works' },
};
export const dynamic = 'force-dynamic';

export default async function WorksPage() {
  const works = await db().workCase.findMany({
    where: { published: true, deletedAt: null },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    select: { slug: true, title: true, category: true, location: true, buildingType: true, summary: true, workDate: true },
  });

  return <PublicShell><main className="bg-slate-50"><section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
    <p className="text-sm font-bold tracking-widest text-red-700">WORKS</p>
    <h1 className="mt-4 text-4xl font-black sm:text-5xl">작업사례</h1>
    <p className="mt-5 text-sm leading-7 text-slate-600">고객의 정확한 주소와 개인정보는 공개하지 않습니다.</p>
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {works.length ? works.map(work => <Link key={work.slug} href={`/works/${work.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
        <div className="flex aspect-[16/9] items-end rounded-xl bg-[linear-gradient(145deg,#e2e8f0,#94a3b8)] p-4"><span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">{inquiryTypeLabel[work.category]}</span></div>
        <h2 className="mt-5 text-xl font-black group-hover:text-red-700">{work.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{[work.location, work.buildingType].filter(Boolean).join(' · ') || '현장 작업사례'}</p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{work.summary ?? '작업 내용을 준비하고 있습니다.'}</p>
      </Link>) : <div className="col-span-full flex min-h-[28rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <span className="flex size-20 items-center justify-center rounded-3xl bg-red-50 text-red-700"><VisualIcon name="clipboard" className="size-10"/></span>
        <h2 className="mt-7 text-2xl font-black text-slate-900">작업사례를 준비하고 있습니다.</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">현장 정보를 안전하게 정리해 순차적으로 공개할 예정입니다. 업데이트 전에도 소방설비 상담은 가능합니다.</p>
        <Link href="/contact" className="mt-8 inline-flex min-h-14 items-center justify-center rounded-xl bg-red-700 px-6 font-bold text-white transition hover:bg-red-800">간편 상담 접수 →</Link>
      </div>}
    </div>
  </section></main></PublicShell>;
}
