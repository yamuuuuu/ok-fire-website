import Link from 'next/link';
import { fireGuides } from '@/content/fire-guides';
import { VisualIcon } from './visual-icon';

export function GuideCards() {
  return <div className="grid gap-5 md:grid-cols-2">{fireGuides.map(guide =>
    <article key={guide.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"><VisualIcon name={guide.icon}/></span><p className="text-xs font-bold text-red-700">{guide.category}</p></div>
      <h3 className="mt-5 text-xl font-black leading-8"><Link href={`/guides/${guide.slug}`} className="hover:text-red-700">{guide.title}</Link></h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{guide.description}</p>
      <Link href={`/guides/${guide.slug}`} aria-label={`${guide.title} 읽기`} className="mt-5 inline-flex min-h-11 items-center font-bold text-red-700">가이드 읽기 →</Link>
    </article>
  )}</div>;
}
