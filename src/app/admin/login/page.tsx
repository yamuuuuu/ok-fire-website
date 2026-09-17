import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { currentAdmin } from '@/lib/session';
export default async function LoginPage() {
  const admin = await currentAdmin(); if (admin) redirect(admin.totpEnabled ? '/admin' : '/admin/security');
  return <main className="flex min-h-dvh items-center justify-center px-5 py-12"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><Link href="/" className="text-xl font-black">OK<span className="text-red-700">소방</span></Link><p className="mt-9 text-xs font-bold tracking-widest text-slate-500">현장 관리</p><h1 className="mt-3 text-3xl font-bold tracking-tight">관리자 로그인</h1><p className="mt-3 text-sm leading-6 text-slate-600">등록된 관리자 계정으로 로그인해주세요.</p><LoginForm/><p className="mt-7 text-xs leading-5 text-slate-500">고객 정보를 보호하기 위해 업무가 끝나면 로그아웃해주세요.</p></section></main>;
}
