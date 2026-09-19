import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public/public-site';
import { JsonLd } from '@/components/public/json-ld';
import { fireGuides } from '@/content/fire-guides';
import { services } from '@/components/public/service-cards';
import { absoluteUrl, siteUrl } from '@/lib/site-url';

export function generateStaticParams() { return fireGuides.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps<'/guides/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const guide = fireGuides.find(item => item.slug === slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${slug}` }, openGraph: { type: 'article', title: `${guide.title} | OK소방`, description: guide.description, url: `/guides/${slug}` } };
}

export default async function GuidePage({ params }: PageProps<'/guides/[slug]'>) {
  const { slug } = await params;
  const guide = fireGuides.find(item => item.slug === slug);
  if (!guide) notFound();
  const service = services.find(item => item.slug === guide.service);
  const url = absoluteUrl(`/guides/${slug}`);
  const structured = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': `${url}#article`, headline: guide.title, description: guide.description, mainEntityOfPage: url, inLanguage: 'ko-KR', author: { '@id': `${siteUrl()}/#business` }, publisher: { '@id': `${siteUrl()}/#business` } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '홈', item: siteUrl() }, { '@type': 'ListItem', position: 2, name: '소방설비 가이드', item: absoluteUrl('/guides') }, { '@type': 'ListItem', position: 3, name: guide.title, item: url }] },
  ] };
  return <PublicShell><main><JsonLd data={structured}/>
    <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16 lg:px-8">
      <nav aria-label="현재 위치" className="text-sm leading-7 text-slate-500"><Link href="/">홈</Link><span className="mx-2">/</span><Link href="/guides">소방설비 가이드</Link></nav>
      <header className="mt-8 border-b border-slate-200 pb-8"><p className="text-sm font-bold text-red-700">{guide.category}</p><h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl sm:leading-tight">{guide.title}</h1><p className="mt-6 text-lg leading-8 text-slate-600">{guide.description}</p><p className="mt-5 text-sm font-semibold text-slate-500">OK소방 · 현장 상담 가이드</p></header>
      <nav aria-label="글 목차" className="mt-8 rounded-2xl bg-slate-50 p-6"><p className="font-bold">이 글에서 확인할 내용</p><ol className="mt-3 space-y-2">{guide.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`} className="inline-block py-1 text-sm leading-6 text-slate-700 underline decoration-slate-300 underline-offset-4">{index + 1}. {section.title}</a></li>)}</ol></nav>
      {guide.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.title} className="mt-12 scroll-mt-36"><h2 className="text-2xl font-black leading-9">{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph} className="mt-5 break-words text-base leading-8 text-slate-700">{paragraph}</p>)}{section.checklist && <ul className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-5 sm:p-7">{section.checklist.map(item => <li key={item} className="flex gap-3 text-sm leading-7"><span aria-hidden="true" className="font-bold text-red-700">✓</span>{item}</li>)}</ul>}</section>)}
      {guide.sources.length > 0 && <aside className="mt-10 border-t border-slate-200 pt-6"><h2 className="text-base font-bold">참고 자료</h2><ul className="mt-3 space-y-3">{guide.sources.map(source => <li key={source.url}><a href={source.url} className="break-words text-sm leading-6 text-slate-600 underline underline-offset-4">{source.title}</a></li>)}</ul></aside>}
      <section className="mt-12 rounded-2xl bg-slate-950 p-6 text-white sm:p-8"><h2 className="text-2xl font-black">우리 현장에 맞는 상담이 필요하신가요?</h2><p className="mt-3 text-sm leading-7 text-slate-300">건물 용도와 현재 설비 상태를 남겨주세요. 평일 09:00~18:00에 상담 문의를 안내합니다.</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/contact" className="inline-flex min-h-12 items-center rounded-xl bg-red-700 px-5 font-bold">간편 상담 접수 →</Link>{service && <Link href={`/services/${service.slug}`} className="inline-flex min-h-12 items-center text-sm font-bold underline underline-offset-4">{service.title} 안내</Link>}</div></section>
      <aside className="mt-10"><h2 className="text-xl font-black">함께 읽어보세요</h2><ul className="mt-4 divide-y divide-slate-200">{fireGuides.filter(item => item.slug !== slug).map(item => <li key={item.slug}><Link href={`/guides/${item.slug}`} className="block py-4 text-sm font-semibold leading-7 hover:text-red-700">{item.title} →</Link></li>)}</ul></aside>
    </article>
  </main></PublicShell>;
}
