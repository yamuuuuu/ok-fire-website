'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    setPending(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error?.message ?? '로그인할 수 없습니다.'); return; }
      router.replace('/admin'); router.refresh();
    } catch { setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={pending}>
    <div><label htmlFor="email" className="mb-2 block text-sm font-semibold">이메일</label><input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={255} required className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" placeholder="관리자 이메일" /></div>
    <div><label htmlFor="password" className="mb-2 block text-sm font-semibold">비밀번호</label><input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required className="min-h-13 w-full rounded-xl border border-slate-300 bg-white px-4 text-base" aria-describedby={error ? 'login-error' : undefined} /></div>
    {error && <p id="login-error" role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <button disabled={pending} className="min-h-14 w-full rounded-xl bg-red-700 px-4 font-bold text-white hover:bg-red-800 disabled:opacity-60">{pending ? '로그인 중…' : '로그인'}</button>
  </form>;
}
