import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TotpSetup } from '@/components/admin/totp-setup';
import { currentAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const admin = await currentAdmin();
  if (!admin) redirect('/admin/login');

  return <main className="flex min-h-dvh items-center justify-center px-5 py-12">
    <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
      <Link href="/" className="text-xl font-black">OK<span className="text-red-700">소방</span></Link>
      <p className="mt-9 text-xs font-bold tracking-widest text-slate-500">관리자 보안</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">인증 앱 설정</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">업무 화면을 사용하려면 인증 앱 설정을 완료해주세요.</p>
      <div className="mt-6"><TotpSetup enabled={admin.totpEnabled}/></div>
    </section>
  </main>;
}
