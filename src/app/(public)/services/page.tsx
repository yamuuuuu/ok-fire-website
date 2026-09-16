import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-site';
import { ServiceCards } from '@/components/public/service-cards';
export const metadata: Metadata = { title: '서비스', description: '소방전기, 소방설비 시공, 소방시설 점검 서비스.', alternates: { canonical: '/services' } };
export default function ServicesPage() { return <PublicShell><main className="bg-slate-50"><section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><p className="text-sm font-bold tracking-widest text-red-700">SERVICES</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">현장에 맞는 소방 서비스</h1><p className="mt-5 max-w-2xl leading-7 text-slate-600">설비의 상태와 건물의 용도, 필요한 일정을 함께 확인한 뒤 진행합니다.</p><div className="mt-12"><ServiceCards/></div></section></main></PublicShell>; }
