'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INQUIRY_STATUSES, statusLabel } from '@/lib/admin-inquiry';

type Note = { id: string; content: string; admin: { id: string; name: string }; createdAt: string; createdAtLabel: string; updatedAt: string };
type Props = {
  inquiryId: string; status: string; assigneeId: string | null; admins: { id: string; name: string }[];
  currentAdmin: { id: string; role: string }; notes: Note[];
};

async function request(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: object) {
  const response = await fetch(url, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(data?.error?.message ?? '요청을 처리하지 못했습니다.');
}

export function InquiryOperations({ inquiryId, status, assigneeId, admins, currentAdmin, notes }: Props) {
  const router = useRouter();
  const [notice, setNotice] = useState<string>(); const [error, setError] = useState<string>(); const [busy, setBusy] = useState<string>();
  const [nextStatus, setNextStatus] = useState(status); const [statusMemo, setStatusMemo] = useState(''); const [nextAssignee, setNextAssignee] = useState(assigneeId ?? ''); const [newNote, setNewNote] = useState(''); const [editing, setEditing] = useState<string>(); const [editContent, setEditContent] = useState('');
  const run = async (key: string, task: () => Promise<void>, success: string) => {
    setBusy(key); setError(undefined); setNotice(undefined);
    try { await task(); setNotice(success); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '요청을 처리하지 못했습니다.'); }
    finally { setBusy(undefined); }
  };
  return <section id="operations" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-lg font-bold">업무 처리</h2>
    {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      <form onSubmit={event => { event.preventDefault(); void run('status', () => request(`/api/admin/inquiries/${inquiryId}/status`, 'PATCH', { status: nextStatus, memo: statusMemo || undefined }), '상태를 저장했습니다.'); }} className="rounded-xl bg-slate-50 p-4">
        <label className="block text-sm font-bold">상태 변경<select value={nextStatus} onChange={event => setNextStatus(event.target.value)} disabled={busy !== undefined} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">{INQUIRY_STATUSES.map(value => <option key={value} value={value}>{statusLabel[value]}</option>)}</select></label>
        <label className="mt-3 block text-sm font-semibold">변경 메모 <span className="font-normal text-slate-500">(선택)</span><textarea value={statusMemo} onChange={event => setStatusMemo(event.target.value)} maxLength={500} disabled={busy !== undefined} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm" placeholder="예: 고객과 통화하여 방문 일정을 조율 중입니다."/></label>
        <button disabled={busy !== undefined} className="mt-3 min-h-11 w-full rounded-lg bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50">{busy === 'status' ? '저장 중…' : '상태 저장'}</button>
      </form>
      <form onSubmit={event => { event.preventDefault(); void run('assignee', () => request(`/api/admin/inquiries/${inquiryId}/assignee`, 'PATCH', { adminId: nextAssignee || null }), '담당자를 저장했습니다.'); }} className="rounded-xl bg-slate-50 p-4">
        <label className="block text-sm font-bold">담당자 지정<select value={nextAssignee} onChange={event => setNextAssignee(event.target.value)} disabled={busy !== undefined} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">미배정</option>{admins.map(admin => <option key={admin.id} value={admin.id}>{admin.name}</option>)}</select></label>
        <p className="mt-3 text-sm leading-6 text-slate-600">활성 관리자만 배정할 수 있습니다. 변경 이력은 접수 타임라인에 남습니다.</p>
        <button disabled={busy !== undefined} className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-50">{busy === 'assignee' ? '저장 중…' : '담당자 저장'}</button>
      </form>
    </div>
    <div className="mt-6 border-t border-slate-200 pt-5"><h3 className="text-base font-bold">상담메모</h3>
      <form onSubmit={event => { event.preventDefault(); void run('new-note', async () => { await request(`/api/admin/inquiries/${inquiryId}/notes`, 'POST', { content: newNote }); setNewNote(''); }, '메모를 등록했습니다.'); }} className="mt-3"><label className="sr-only" htmlFor="new-note">새 상담메모</label><textarea id="new-note" value={newNote} onChange={event => setNewNote(event.target.value)} maxLength={5000} disabled={busy !== undefined} placeholder="상담 내용과 다음 조치를 기록하세요." className="min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm"/><button disabled={busy !== undefined || !newNote.trim()} className="mt-3 min-h-11 rounded-lg bg-red-700 px-5 text-sm font-bold text-white disabled:opacity-50">{busy === 'new-note' ? '등록 중…' : '메모 등록'}</button></form>
      <ul className="mt-5 space-y-3">{notes.length ? notes.map(note => <li key={note.id} className="rounded-xl border border-slate-200 p-4">{editing === note.id ? <form onSubmit={event => { event.preventDefault(); void run(`edit-${note.id}`, async () => { await request(`/api/admin/inquiries/${inquiryId}/notes/${note.id}`, 'PATCH', { content: editContent }); setEditing(undefined); }, '메모를 수정했습니다.'); }}><label className="sr-only" htmlFor={`note-${note.id}`}>상담메모 수정</label><textarea id={`note-${note.id}`} value={editContent} onChange={event => setEditContent(event.target.value)} maxLength={5000} className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm"/><div className="mt-3 flex gap-2"><button className="min-h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white">저장</button><button type="button" onClick={() => setEditing(undefined)} className="min-h-10 rounded-lg px-3 text-sm font-bold">취소</button></div></form> : <><p className="whitespace-pre-wrap break-words text-sm leading-6">{note.content}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{note.admin.name} · {note.createdAtLabel}</span>{(note.admin.id === currentAdmin.id || currentAdmin.role === 'SUPER_ADMIN') && <span className="flex gap-3"><button type="button" onClick={() => { setEditing(note.id); setEditContent(note.content); }} className="font-bold text-slate-700">수정</button><button type="button" onClick={() => void run(`delete-${note.id}`, () => request(`/api/admin/inquiries/${inquiryId}/notes/${note.id}`, 'DELETE'), '메모를 삭제했습니다.')} className="font-bold text-red-700">삭제</button></span>}</div></>}</li>) : <li className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">등록된 상담메모가 없습니다.</li>}</ul>
    </div>
  </section>;
}
