'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const baseItems = [{ href: '/admin', label: '홈' }, { href: '/admin/inquiries', label: '접수' }, { href: '/admin/schedule', label: '일정' }, { href: '/admin/works', label: '사례' }];
function active(pathname: string, href: string) { return href === '/admin' ? pathname === href : pathname.startsWith(href); }

export function DesktopAdminNavigation({ superAdmin }: { superAdmin: boolean }) {
  const pathname = usePathname();
  return <nav className="mt-10 space-y-2" aria-label="관리자 메뉴">
    {baseItems.map(item => <Link key={item.href} href={item.href} aria-current={active(pathname, item.href) ? 'page' : undefined} className={`block rounded-xl px-4 py-4 font-bold ${active(pathname, item.href) ? 'bg-red-50 text-red-800' : 'text-slate-700 hover:bg-slate-50'}`}>{item.label}</Link>)}
    <Link href="/admin/faq" aria-current={active(pathname, '/admin/faq') ? 'page' : undefined} className={`block rounded-xl px-4 py-4 font-bold ${active(pathname, '/admin/faq') ? 'bg-red-50 text-red-800' : 'text-slate-700 hover:bg-slate-50'}`}>FAQ</Link>
    {superAdmin && <><Link href="/admin/users" aria-current={active(pathname, '/admin/users') ? 'page' : undefined} className={`block rounded-xl px-4 py-4 font-bold ${active(pathname, '/admin/users') ? 'bg-red-50 text-red-800' : 'text-slate-700 hover:bg-slate-50'}`}>관리자</Link><Link href="/admin/settings" aria-current={active(pathname, '/admin/settings') ? 'page' : undefined} className={`block rounded-xl px-4 py-4 font-bold ${active(pathname, '/admin/settings') ? 'bg-red-50 text-red-800' : 'text-slate-700 hover:bg-slate-50'}`}>설정</Link></>}
  </nav>;
}

export function MobileAdminNavigation() {
  const pathname = usePathname();
  return <nav aria-label="모바일 관리자 메뉴" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
    {baseItems.slice(0, 3).map(item => <Link key={item.href} href={item.href} aria-current={active(pathname, item.href) ? 'page' : undefined} className={`flex min-h-14 items-center justify-center rounded-xl text-sm font-bold ${active(pathname, item.href) ? 'bg-red-50 text-red-800' : 'text-slate-600'}`}>{item.label}</Link>)}
    <Link href="/admin/works" aria-current={active(pathname, '/admin/works') ? 'page' : undefined} className={`flex min-h-14 items-center justify-center rounded-xl text-sm font-bold ${active(pathname, '/admin/works') ? 'bg-red-50 text-red-800' : 'text-slate-600'}`}>사례</Link>
  </nav>;
}
