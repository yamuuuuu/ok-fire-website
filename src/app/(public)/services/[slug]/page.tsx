import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public/public-site';
import { services } from '@/components/public/service-cards';
import { TrackView } from '@/components/public/analytics';
import { JsonLd } from '@/components/public/json-ld';
import { absoluteUrl, siteUrl } from '@/lib/site-url';

export function generateStaticParams() { return services.map(service => ({ slug: service.slug })); }

export async function generateMetadata({ params }: PageProps<'/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find(item => item.slug === slug);
  return service ? { title: service.title, description: service.text, alternates: { canonical: `/services/${service.slug}` }, openGraph: { title: `${service.title} | OK소방`, description: service.text } } : {};
}

export default async function ServiceDetail({ params }: PageProps<'/services/[slug]'>) {
  const { slug } = await params;
  const service = services.find(item => item.slug === slug);
  if (!service) notFound();
  const serviceUrl=absoluteUrl(`/services/${service.slug}`); const structured={ '@context':'https://schema.org','@graph':[{ '@type':'BreadcrumbList',itemListElement:[{ '@type':'ListItem',position:1,name:'홈',item:siteUrl()},{ '@type':'ListItem',position:2,name:'서비스',item:absoluteUrl('/services')},{ '@type':'ListItem',position:3,name:service.title,item:serviceUrl}]},{ '@type':'Service','@id':`${serviceUrl}#service`,name:service.title,description:service.text,url:serviceUrl,serviceType:service.title,areaServed:{'@type':'City',name:'서울특별시'},provider:{'@id':`${siteUrl()}/#business`}}]};
  return <PublicShell><main><TrackView event="service_view" value={service.slug}/><JsonLd data={structured}/><section className="bg-slate-950 text-white"><div className="mx-auto max-w-5xl px-5 py-20 lg:px-8"><nav aria-label="현재 위치" className="text-sm text-slate-400"><Link href="/">홈</Link><span className="mx-2">/</span><Link href="/services">서비스</Link><span className="mx-2">/</span><span>{service.title}</span></nav><p className="mt-8 text-sm font-bold tracking-widest text-red-400">SERVICE {service.number}</p><h1 className="mt-5 text-4xl font-black sm:text-6xl">{service.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{service.text}</p></div></section><section className="mx-auto max-w-5xl px-5 py-16 lg:px-8"><div className="max-w-3xl"><h2 className="text-3xl font-black">현장 조건을 먼저 확인합니다</h2><p className="mt-5 text-base leading-8 text-slate-600">{service.overview}</p></div><div className="mt-14 grid gap-10 lg:grid-cols-2"><section><h2 className="text-2xl font-black">진행 순서</h2><ol className="mt-6 grid gap-3">{service.steps.map((step, index) => <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 p-5"><span className="font-black text-red-700">0{index + 1}</span><p className="font-bold leading-6">{step}</p></li>)}</ol></section><section><h2 className="text-2xl font-black">상담 전 확인하면 좋은 내용</h2><ul className="mt-6 grid gap-3">{service.checks.map(item => <li key={item} className="rounded-2xl bg-slate-100 p-5 text-sm font-semibold leading-6 text-slate-700">{item}</li>)}</ul></section></div><section className="mt-14 rounded-3xl bg-slate-100 p-7 sm:p-9"><p className="text-sm font-bold tracking-widest text-red-700">FAQ</p><h2 className="mt-3 text-2xl font-black">{service.faq.question}</h2><p className="mt-4 max-w-3xl leading-8 text-slate-600">{service.faq.answer}</p></section><section className="mt-10 rounded-3xl bg-red-700 p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9"><div><h2 className="text-2xl font-black">현장 상담이 필요하신가요?</h2><p className="mt-3 text-sm leading-6 text-red-100">건물 용도와 현재 설비 상황을 남겨주시면 확인 후 안내드립니다.</p></div><Link href="/contact" className="mt-6 inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 font-bold text-red-800 sm:mt-0">간편 상담 접수 →</Link></section></section></main></PublicShell>;
}
