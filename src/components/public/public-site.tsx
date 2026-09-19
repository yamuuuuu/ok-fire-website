'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PageViewTracker } from './analytics';
import { BrandLogo } from './brand-logo';

const links = [
  { href: '/about', label: '회사소개' },
  { href: '/services', label: '서비스' },
  { href: '/works', label: '작업사례' },
  { href: '/guides', label: '소방설비 가이드' },
  { href: '/faq', label: 'FAQ' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
      <Link href="/" aria-label="OK소방 홈"><BrandLogo priority/></Link>
      <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 lg:flex">
        {links.map(link => <Link key={link.href} href={link.href} className="hover:text-red-700">{link.label}</Link>)}
        <Link href="/contact" className="rounded-xl bg-red-700 px-4 py-3 text-white">간편 상담 접수</Link>
      </nav>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-menu" className="min-h-11 min-w-11 rounded-lg border border-slate-300 text-lg font-bold lg:hidden">{open ? '×' : '☰'}<span className="sr-only">메뉴</span></button>
    </div>
    {open && <nav id="public-menu" className="border-t border-slate-200 bg-white px-5 py-3 lg:hidden">
      {links.map(link => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} className="block min-h-12 py-3 font-bold">{link.label}</Link>)}
      <Link onClick={() => setOpen(false)} href="/contact" className="mb-2 mt-1 flex min-h-12 items-center justify-center rounded-xl bg-red-700 font-bold text-white">간편 상담 접수</Link>
    </nav>}
  </header>;
}

export function PublicFooter() {
  return <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
      <div>
        <div className="inline-flex rounded-xl bg-white p-3"><BrandLogo large/></div>
        <p className="mt-4 text-sm leading-7">소방전기 · 소방설비 시공 · 소방시설 점검<br/>현장을 아는 전문가와 상담하세요.</p>
      </div>
      <div><p className="text-sm font-bold text-white">바로가기</p><div className="mt-4 grid gap-3 text-sm">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href="/contact">간편 상담 접수</Link></div></div>
      <div><p className="text-sm font-bold text-white">상담 안내</p><address className="mt-4 text-sm leading-7 not-italic">서울특별시 중랑구 사가정로42길 23<br/>평일 09:00~18:00</address><p className="mt-2 text-sm leading-7">온라인 접수 내용을 확인한 뒤 연락드립니다.</p><Link href="/privacy" className="mt-3 inline-block text-sm underline underline-offset-4">개인정보 수집·이용 안내</Link></div>
    </div>
    <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} OK소방. All rights reserved.</div>
  </footer>;
}

export function MobileContactCta() {
  return <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 pb-[max(0px,env(safe-area-inset-bottom))] md:hidden">
    <span aria-label="대표 전화번호 준비 중" className="flex min-h-14 items-center justify-center bg-white text-sm font-bold text-slate-400">전화 상담 준비 중</span>
    <Link href="/contact" className="flex min-h-14 items-center justify-center bg-red-700 text-sm font-bold text-white">간편 상담 접수</Link>
  </div>;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white pb-14 md:pb-0"><PageViewTracker/><PublicHeader/>{children}<PublicFooter/><MobileContactCta/></div>;
}
