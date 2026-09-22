import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-site';
import { GuideCards } from '@/components/public/guide-cards';

export const metadata: Metadata = {
  title: '소방설비 가이드',
  description: '화재감지기·화재경보기·소화전·시각경보기·프리액션밸브·방화셔터 결선·자동소화장치·화재수신기·제연설비·자동개폐기의 역할과 시공·보수 상담 안내입니다.',
  alternates: { canonical: '/guides' },
};

export default function GuidesPage() {
  return <PublicShell><main className="bg-slate-50"><section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
    <p className="text-sm font-bold tracking-widest text-red-700">FIRE SAFETY GUIDE</p>
    <h1 className="mt-4 text-4xl font-black sm:text-5xl">소방설비 가이드</h1>
    <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">설비가 낯선 건물 관리자와 사업주를 위해, 상담 전에 알아두면 좋은 내용을 모았습니다. 현장 상황에 맞는 글부터 살펴보세요.</p>
    <div className="mt-10"><GuideCards/></div>
  </section></main></PublicShell>;
}
