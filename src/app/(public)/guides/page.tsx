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
    <nav aria-label="가이드 주제" className="mt-6 flex flex-wrap gap-3">
      <a href="#interior" className="inline-flex min-h-11 items-center rounded-full bg-red-700 px-5 text-sm font-bold text-white">업종별 인테리어 소방공사</a>
      <a href="#equipment" className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold">설비·업체 선택 가이드</a>
    </nav>
    <section id="interior" className="mt-12 scroll-mt-32">
      <h2 className="text-2xl font-black">인테리어 소방공사, 업종별로 알아보세요</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">공통 준비사항과 오피스·상가 건물·음식점·필라테스·헬스장·편의점·마트의 공간별 안내입니다. 실제 공사 범위는 건물 조건과 변경 내용을 확인해 정합니다.</p>
      <div className="mt-6"><GuideCards group="interior"/></div>
    </section>
    <section id="equipment" className="mt-14 scroll-mt-32">
      <h2 className="text-2xl font-black">설비와 업체 선택 가이드</h2>
      <div className="mt-6"><GuideCards group="general"/></div>
    </section>
  </section></main></PublicShell>;
}
