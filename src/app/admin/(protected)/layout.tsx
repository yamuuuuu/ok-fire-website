import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/session';
import { LogoutButton } from '@/components/logout-button';
import { DesktopAdminNavigation, MobileAdminNavigation } from '@/components/admin/admin-navigation';
export const dynamic = 'force-dynamic';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin(); if (!admin) redirect('/admin/login'); if (!admin.totpEnabled) redirect('/admin/security');
  return <div className="min-h-dvh lg:pl-60">
    <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 bg-white p-6 lg:block"><Link href="/admin" className="text-xl font-black">OK소방 <span className="text-xs font-medium text-slate-500">관리자</span></Link><DesktopAdminNavigation superAdmin={admin.role === 'SUPER_ADMIN'}/></aside>
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><span className="font-bold lg:hidden">OK소방 관리자</span><div className="flex items-center gap-3 text-sm"><div><strong>{admin.name}</strong><span className="ml-2 text-slate-500">{admin.role === 'SUPER_ADMIN' ? '최고 관리자' : '매니저'}</span></div>{admin.role==='SUPER_ADMIN'&&<Link href="/admin/users" className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold lg:hidden">관리자</Link>}</div><LogoutButton/></header>
    <main className="mx-auto max-w-6xl px-5 pt-8 pb-32 sm:px-8">{children}</main>
    <MobileAdminNavigation/>
  </div>;
}
