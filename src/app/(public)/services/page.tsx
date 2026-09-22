import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-site';
import { ServiceCards } from '@/components/public/service-cards';
export const metadata: Metadata = { title: '소방설비 시공·보수 서비스', description: '소방전기, 소방설비 시공, 스프링클러 설치, 화재경보기·자동화재탐지설비, 설비 보수 현장 상담.', alternates: { canonical: '/services' } };
export default function ServicesPage() { return <PublicShell><main className="bg-slate-50"><section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><p className="text-sm font-bold tracking-widest text-red-700">SERVICES</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">현장에 맞는 소방 서비스</h1><p className="mt-5 max-w-2xl leading-7 text-slate-600">소방전기, 소방설비 시공, 스프링클러 설치, 화재경보기·자동화재탐지설비, 설비 보수 등 현장 상황을 확인한 뒤 필요한 내용을 안내합니다.</p><div className="mt-12"><ServiceCards/></div></section></main></PublicShell>; }
