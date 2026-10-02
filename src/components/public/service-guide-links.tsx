import Link from 'next/link';
import { fireGuides } from '@/content/fire-guides';

export function ServiceGuideLinks({ service }: { service: string }) {
  const guides = fireGuides.filter(guide => guide.service === service).slice(0, 4);
  if (!guides.length) return null;
  return <section className="mt-12">
    <h2 className="text-2xl font-black">상담 전에 읽어보세요</h2>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{guides.map(guide =>
      <Link key={guide.slug} href={`/guides/${guide.slug}`} className="rounded-2xl border border-slate-200 p-5 hover:border-red-300">
        <h3 className="font-bold leading-7 text-red-700">{guide.title} →</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{guide.description}</p>
      </Link>
    )}</div>
  </section>;
}
