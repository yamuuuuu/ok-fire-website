import Image from 'next/image';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { firstWorkLink, loadWorkPreview, type WorkPreview } from '@/lib/work-preview';
import { inquiryTypeLabel } from '@/lib/admin-inquiry';

type Work = {
  slug: string; title: string; category: keyof typeof inquiryTypeLabel;
  location: string | null; buildingType: string | null; summary: string | null;
  description: string; updatedAt: Date;
};

const cachedPreview = unstable_cache(
  async (href: string, revision: string) => { void revision; return loadWorkPreview(href); },
  ['work-link-preview-v1'], { revalidate: 86400 },
);

export function WorkCard({ work, preview }: { work: Work; preview?: WorkPreview }) {
  const href = firstWorkLink(work.description, work.summary);
  const thumbnail = <>
    <div className="relative flex aspect-[16/9] items-end overflow-hidden rounded-xl bg-[linear-gradient(145deg,#e2e8f0,#94a3b8)] p-4">
      {preview?.image && <Image unoptimized src={preview.image} alt={preview.title || work.title} width={800} height={450} className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"/>}
      <span className="relative rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700">{inquiryTypeLabel[work.category]}</span>
    </div>
    {href && <div className="mt-3 min-w-0">
      <p className="line-clamp-2 break-words text-sm font-bold text-slate-800">{preview?.title || '관련 작업 기록 보기'}</p>
      <p className="mt-1 break-all text-xs text-slate-500">{new URL(href).hostname} · 원문 보기 ↗</p>
    </div>}
  </>;
  return <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    {href
      ? <a href={href} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={`${work.title} 원문 보기`}>{thumbnail}</a>
      : <Link href={`/works/${work.slug}`} className="group block" aria-label={`${work.title} 상세 보기`}>{thumbnail}</Link>}
    <h2 className="mt-5 text-xl font-black"><Link href={`/works/${work.slug}`} className="hover:text-red-700">{work.title}</Link></h2>
    <p className="mt-2 text-sm text-slate-500">{[work.location, work.buildingType].filter(Boolean).join(' · ') || '현장 작업사례'}</p>
    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{work.summary ?? '작업 내용을 준비하고 있습니다.'}</p>
    <Link href={`/works/${work.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-red-700">작업사례 상세 보기 →</Link>
  </article>;
}

export async function WorkPreviewCard({ work }: { work: Work }) {
  const href = firstWorkLink(work.description, work.summary);
  const preview = href ? await cachedPreview(href, work.updatedAt.toISOString()) : undefined;
  return <WorkCard work={work} preview={preview}/>;
}
