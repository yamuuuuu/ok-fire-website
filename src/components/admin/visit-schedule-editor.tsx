'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Admin = { id: string; name: string };
type Visit = { id: string; visitDate: string; visitTime: string | null; address: string; addressDetail: string | null; memo: string | null; status: string; assignedAdmin: Admin | null };
const inputClass = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3';

export function VisitScheduleEditor({ inquiryId, visit, admins, address, addressDetail }: { inquiryId: string; visit?: Visit; admins: Admin[]; address: string; addressDetail: string | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Visit>();
  const current = saved ?? visit;
  const [editing, setEditing] = useState(!visit);
  const [date, setDate] = useState(visit?.visitDate ?? '');
  const [time, setTime] = useState(visit?.visitTime?.slice(11, 16) ?? '');
  const [assignee, setAssignee] = useState(visit?.assignedAdmin?.id ?? '');
  const [memo, setMemo] = useState(visit?.memo ?? '');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function request(url: string, method: string, body: object) {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? '일정을 저장하지 못했습니다.');
    return result.data;
  }
  async function run(task: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try { await task(); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '처리하지 못했습니다.'); router.refresh(); }
    finally { pending.current = false; setBusy(false); }
  }
  function edit() {
    if (!current) return;
    setDate(current.visitDate); setTime(current.visitTime?.slice(11, 16) ?? '');
    setAssignee(current.assignedAdmin?.id ?? ''); setMemo(current.memo ?? '');
    setEditing(true); setMessage(''); setError('');
  }
  async function save() {
    const fields = { visitDate: date, assignedAdminId: assignee || null };
    const result = current
      ? await request(`/api/admin/visits/${current.id}`, 'PATCH', { ...fields, visitTime: time || null, memo: memo.trim() || null })
      : await request(`/api/admin/inquiries/${inquiryId}/visits`, 'POST', { ...fields, visitTime: time || undefined, memo: memo.trim() || undefined, address, addressDetail: addressDetail || undefined, changeInquiryStatus: true });
    setSaved({ id: current?.id ?? result.id, visitDate: date, visitTime: time ? `1970-01-01T${time}:00.000Z` : null, memo: memo.trim() || null, assignedAdmin: admins.find(a => a.id === assignee) ?? null, address: current?.address ?? address, addressDetail: current?.addressDetail ?? addressDetail, status: current?.status ?? 'SCHEDULED' });
    setEditing(false); setMessage(current ? '방문 일정을 수정했습니다.' : '방문 일정을 등록했습니다.');
  }
  return <section className="rounded-xl bg-slate-50 p-4" aria-label="방문 일정 관리">
    <h3 className="font-bold">{editing ? current ? '방문 일정 수정' : '방문 일정 등록' : '방문 일정'}</h3>
    {editing ? <form onSubmit={event => { event.preventDefault(); void run(save); }}>
      <fieldset disabled={busy}>
        <label className="mt-3 block text-sm font-semibold">날짜<input required type="date" value={date} onChange={event => setDate(event.target.value)} className={inputClass}/></label>
        <label className="mt-3 block text-sm font-semibold">시간<input type="time" value={time} onChange={event => setTime(event.target.value)} className={inputClass}/></label>
        <label className="mt-3 block text-sm font-semibold">담당자<select value={assignee} onChange={event => setAssignee(event.target.value)} className={inputClass}><option value="">미배정</option>{admins.map(admin => <option key={admin.id} value={admin.id}>{admin.name}</option>)}</select></label>
        <label className="mt-3 block text-sm font-semibold">메모<textarea value={memo} onChange={event => setMemo(event.target.value)} maxLength={5000} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"/></label>
        <div className="mt-3 flex gap-2"><button className="min-h-11 flex-1 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? '저장 중…' : current ? '수정 저장' : '일정 등록'}</button>{current && <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold">취소</button>}</div>
      </fieldset>
    </form> : current && <div className="mt-3 text-sm">
      <p className="text-base font-bold">{current.visitDate} · {current.visitTime?.slice(11, 16) || '시간 미정'}</p>
      <p className="mt-2 text-slate-600">{current.assignedAdmin?.name ?? '미배정'} · {current.status === 'COMPLETED' ? '방문 완료' : current.status === 'CANCELED' ? '취소' : '방문 예정'}</p>
      {current.memo && <p className="mt-2 whitespace-pre-wrap break-words text-slate-600">{current.memo}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={edit} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-bold disabled:opacity-50">일정 수정</button>
        <button type="button" disabled={busy || current.status !== 'SCHEDULED'} onClick={() => void run(async () => { await request(`/api/admin/visits/${current.id}/status`, 'PATCH', { status: 'COMPLETED', changeInquiryStatus: true }); setSaved({ ...current, status: 'COMPLETED' }); setMessage('방문 완료로 처리했습니다.'); })} className="min-h-11 rounded-lg bg-slate-900 px-3 font-bold text-white disabled:opacity-50">{current.status === 'COMPLETED' ? '방문 완료됨' : '방문 완료'}</button>
      </div>
    </div>}
    {message && <p role="status" className="mt-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
  </section>;
}
