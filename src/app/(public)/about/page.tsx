import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/public/public-site';
import { VisualIcon, type VisualIconName } from '@/components/public/visual-icon';

export const metadata: Metadata = {
  title: '회사소개',
  description: '30년 현장 경험의 OK소방을 소개합니다.',
  alternates: { canonical: '/about' },
  openGraph: { title: '회사소개 | OK소방', description: '30년 현장 경험의 OK소방을 소개합니다.' },
};

const approaches: { number: string; title: string; text: string; icon: VisualIconName }[] = [
  { number: '01', title: '현장 확인', text: '건물과 설비의 현재 상태를 먼저 파악합니다.', icon: 'search' },
  { number: '02', title: '필요한 조치 안내', text: '전문 용어만 나열하지 않고 이유와 순서를 설명합니다.', icon: 'message' },
  { number: '03', title: '일정과 진행 관리', text: '상담부터 방문·견적·공사 진행까지 기록합니다.', icon: 'calendar' },
  { number: '04', title: '안전 중심', text: '설비의 목적과 현장 안전을 중심에 둡니다.', icon: 'shield' },
];

export default function AboutPage() {
  return <PublicShell><main>
    <section className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-5 py-20 sm:py-28 lg:px-8">
      <p className="text-sm font-bold tracking-widest text-red-400">ABOUT OKFIRE</p>
      <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">현장을 아는 경험으로<br/>안전을 준비합니다.</h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">OK소방은 소방전기, 소방설비 시공, 소방시설 점검을 중심으로 현장의 상황을 먼저 확인하고 필요한 내용을 안내합니다.</p>
    </div></section>
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
      <div><p className="text-sm font-bold tracking-widest text-red-700">OUR APPROACH</p><h2 className="mt-4 text-3xl font-black">복잡한 현장도<br/>알기 쉽게 설명합니다.</h2></div>
      <div className="grid gap-4 sm:grid-cols-2">{approaches.map(item => <article key={item.number} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
        <div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-white text-red-700 shadow-sm"><VisualIcon name={item.icon}/></span><p className="font-black text-slate-300">{item.number}</p></div>
        <h3 className="mt-6 text-lg font-black">{item.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
      </article>)}</div>
    </div></section>
    <section className="bg-red-700"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-12 text-white sm:flex-row sm:items-center lg:px-8">
      <div><h2 className="text-2xl font-black">현장 상담이 필요하신가요?</h2><p className="mt-2 text-sm text-red-100">상황을 남겨주시면 확인 후 연락드립니다.</p></div>
      <Link href="/contact" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-white px-6 font-bold text-red-800">간편 상담 접수 →</Link>
    </div></section>
  </main></PublicShell>;
}
