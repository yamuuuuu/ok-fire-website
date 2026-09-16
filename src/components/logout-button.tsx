'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function LogoutButton() {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function logout() {
    setPending(true); setError('');
    try {
      const response = await fetch('/api/admin/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      router.replace('/admin/login'); router.refresh();
    } catch { setError('로그아웃에 실패했습니다. 다시 시도해주세요.'); }
    finally { setPending(false); }
  }
  return <div><button onClick={logout} disabled={pending} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold disabled:opacity-50">{pending ? '로그아웃 중…' : '로그아웃'}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
