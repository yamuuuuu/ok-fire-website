'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EmailRetryButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function retry() {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/notifications/retry', { method: 'POST' });
      if (!response.ok) throw new Error();
      setMessage('재시도 가능한 알림을 처리했습니다. 상태를 확인해주세요.');
      router.refresh();
    } catch { setMessage('처리하지 못했습니다. 잠시 후 다시 시도해주세요.'); }
    finally { setBusy(false); }
  }
  return <><button type="button" disabled={busy} onClick={retry} className="mt-4 min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? '처리 중…' : '대기·실패 알림 재시도'}</button><p role="status" className="mt-2 text-sm text-slate-600">{message}</p></>;
}
