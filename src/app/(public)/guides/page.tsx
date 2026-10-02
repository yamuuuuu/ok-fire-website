import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-site';
import { GuideCards } from '@/components/public/guide-cards';

export const metadata: Metadata = {
  title: '소방설비 가이드',
  description: '소방업체 선택 기준부터 소방설비 종류, 상가 인테리어 소방공사, 수리·교체와 견적 비교까지. 감지기·소화전·스프링클러 등 설비별 안내를 함께 확인하세요.',
  alternates: { canonical: '/guides' },
};

export default function GuidesPage() {
  return <PublicShell><main className="bg-slate-50"><section className="mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
    <p className="text-sm font-bold tracking-widest text-red-700">FIRE SAFETY GUIDE</p>
    <h1 className="mt-4 text-4xl font-black sm:text-5xl">소방설비 가이드</h1>
    <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">소방업체를 고르는 기준부터 소방설비의 역할, 설치·보수 준비까지 건물 관리자와 사업주에게 필요한 내용을 모았습니다. 공사를 처음 준비한다면 업체 선택과 설비 기초 안내부터, 특정 장치가 궁금하다면 설비별 글부터 살펴보세요.</p>
    <div className="mt-10"><GuideCards/></div>
  </section></main></PublicShell>;
}
