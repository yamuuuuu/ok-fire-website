'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PrivacyNotice } from '@/lib/privacy';
import { inquiryErrors, inquirySchema, inquiryTypes, contactTimes, stepFields, type InquiryDraft } from '@/validations/inquiry';
import { PrivacySummary } from './privacy-summary';
import { trackEvent } from '@/components/public/analytics';
const steps = ['문의 유형', '현장 정보', '문의 내용', '연락 정보', '확인 및 동의'];
const initialDraft = (version: string): InquiryDraft => ({
  inquiryType: '', customerName: '', phone: '', companyName: '', address: '',
  addressDetail: '', description: '', preferredContactTime: 'ANYTIME', preferredContactDetail: '',
  preferredWorkDate: '', privacyAgreed: false, privacyPolicyVersion: version,
});
const control = 'min-h-13 w-full rounded-xl border bg-white px-4 py-3 text-base outline-offset-2';
const keyStorage = 'okfire-inquiry-request-key';
export function ContactForm({ notice }: { notice: PrivacyNotice }) {
  const router = useRouter();
  const [draft, setDraft] = useState<InquiryDraft>(() => initialDraft(notice.version));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const submitting = useRef(false);
  const completed = useRef(false);
  const requestKey = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [step]);
  useEffect(() => { trackEvent('contact_start'); }, []);
  function update<K extends keyof InquiryDraft>(field: K, value: InquiryDraft[K]) {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => { const next = { ...current }; delete next[field]; return next; });
  }
  function move(next: number) { setMessage(''); setErrors({}); setStep(next); }
  function showErrors(fields: Record<string, string>, targetStep = step) {
    setErrors(fields); setStep(targetStep);
    requestAnimationFrame(() => document.getElementById(Object.keys(fields)[0])?.focus());
  }
  function next() {
    const result = inquirySchema.safeParse(draft);
    const all = result.success ? {} : inquiryErrors(result.error.issues);
    const fields = Object.fromEntries(Object.entries(all).filter(([key]) => stepFields[step].includes(key as keyof InquiryDraft)));
    if (Object.keys(fields).length) { showErrors(fields); return; }
    move(step + 1);
  }
  function getRequestKey() {
    if (!requestKey.current) {
      try { requestKey.current = sessionStorage.getItem(keyStorage); } catch { /* Storage can be disabled in private mode. */ }
      requestKey.current ||= crypto.randomUUID();
      try { sessionStorage.setItem(keyStorage, requestKey.current); } catch { /* Keep the token in memory. */ }
    }
    return requestKey.current;
  }
  function clearRequestKey() {
    requestKey.current = null;
    try { sessionStorage.removeItem(keyStorage); } catch { /* No customer information is persisted. */ }
  }
  function finish() {
    completed.current = true; clearRequestKey();
    router.replace('/contact/complete');
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (step < 4) { next(); return; }
    const parsed = inquirySchema.safeParse(draft);
    if (!parsed.success) {
      const fields = inquiryErrors(parsed.error.issues);
      const invalidStep = stepFields.findIndex(group => group.some(field => fields[field]));
      showErrors(fields, invalidStep < 0 ? 4 : invalidStep); return;
    }
    submitting.current = true; setPending(true); setMessage(''); setConflict(false);
    trackEvent('contact_submit');
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': getRequestKey() },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error?.message ?? '접수할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setConflict(result.error?.code === 'IDEMPOTENCY_CONFLICT');
        if (result.error?.fields) {
          const fields = result.error.fields as Record<string, string>;
          const invalidStep = stepFields.findIndex(group => group.some(field => fields[field]));
          showErrors(fields, invalidStep < 0 ? 4 : invalidStep);
        }
        return;
      }
      finish();
    } catch { setMessage('접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 접수하면 같은 요청의 중복 저장을 방지합니다.'); }
    finally { if (!completed.current) { submitting.current = false; setPending(false); } }
  }
  function field(id: keyof InquiryDraft, label: string, options: { optional?: boolean; type?: string; maxLength?: number; autoComplete?: string; inputMode?: 'numeric' | 'tel'; placeholder?: string } = {}) {
    return <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}{options.optional && <span className="ml-2 font-normal text-slate-400">선택</span>}</label>
      <input id={id} name={id} value={String(draft[id])} onChange={event => update(id, event.target.value)} type={options.type ?? 'text'} maxLength={options.maxLength} autoComplete={options.autoComplete} inputMode={options.inputMode} placeholder={options.placeholder} aria-required={!options.optional} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-error` : undefined} className={`${control} ${errors[id] ? 'border-red-600' : 'border-slate-300'}`} />
      {errors[id] && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">{errors[id]}</p>}
    </div>;
  }
  return <form noValidate onSubmit={submit} className="mt-8" aria-busy={pending}>
    <nav aria-label="접수 진행 단계">
      <div className="flex items-center justify-between gap-4 text-sm"><span className="font-bold text-red-700">{step + 1} / {steps.length} 단계</span><span className="font-semibold text-slate-700">{steps[step]}</span></div>
      <ol className="mt-4 grid grid-cols-5" aria-label={`${steps.length}단계 중 ${step + 1}단계`}>
        {steps.map((label, index) => {
          const isComplete = index < step;
          const isCurrent = index === step;
          return <li key={label} aria-current={isCurrent ? 'step' : undefined} className="relative flex min-w-0 flex-col items-center">
            {index < steps.length - 1 && <span aria-hidden="true" className={`absolute top-[1.0625rem] left-[calc(50%+1rem)] h-0.5 w-[calc(100%-2rem)] ${index < step ? 'bg-slate-950' : 'bg-slate-200'}`}/>}
            <span className={`relative z-[1] flex size-9 items-center justify-center rounded-full text-sm font-black transition-colors ${isComplete ? 'bg-slate-950 text-white' : isCurrent ? 'bg-red-700 text-white ring-4 ring-red-100' : 'bg-slate-200 text-slate-500'}`}>
              {isComplete ? <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m4 10 4 4 8-8"/></svg> : index + 1}
            </span>
            <span className={`mt-2 hidden text-center text-xs leading-5 sm:block ${isCurrent ? 'font-bold text-red-700' : isComplete ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{label}</span>
          </li>;
        })}
      </ol>
    </nav>
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-bold text-red-700">STEP {step + 1} / 5</p>
      <h2 ref={heading} tabIndex={-1} className="mt-3 text-2xl font-bold tracking-tight outline-none">{['어떤 도움이 필요하세요?', '어느 현장인가요?', '현장 상황을 알려주세요.', '어떻게 연락드릴까요?', '내용을 확인해주세요.'][step]}</h2>
      <fieldset disabled={pending} className="mt-6 space-y-5">
        <legend className="sr-only">{steps[step]}</legend>
        {step === 0 && <>
          <p className="text-sm leading-6 text-slate-500">가장 가까운 유형을 하나 선택해주세요.</p>
          <div id="inquiryType" tabIndex={-1} role="radiogroup" aria-label="문의 유형" aria-required="true" aria-describedby={errors.inquiryType ? 'inquiryType-error' : undefined} className="grid gap-3 sm:grid-cols-2">{inquiryTypes.map(item => <label key={item.value} className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border p-4 has-focus-visible:ring-2 has-focus-visible:ring-red-700 ${draft.inquiryType === item.value ? 'border-red-700 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="inquiryType" value={item.value} checked={draft.inquiryType === item.value} onChange={() => update('inquiryType', item.value)} className="mt-1 size-4 shrink-0 accent-red-700"/><span><strong className="block text-base">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span></label>)}</div>
          {errors.inquiryType && <p id="inquiryType-error" role="alert" className="text-sm text-red-700">{errors.inquiryType}</p>}
        </>}
        {step === 1 && <>
          {field('address', '현장 주소', { maxLength: 255, placeholder: '시·군·구와 도로명 또는 지번 주소', autoComplete: 'off' })}
          {field('addressDetail', '상세주소', { optional: true, maxLength: 255, placeholder: '동·호수, 층 등', autoComplete: 'off' })}
          {field('companyName', '업체명 / 건물명', { optional: true, maxLength: 100, autoComplete: 'organization' })}
        </>}
        {step === 2 && <>
          <div><label htmlFor="description" className="mb-2 block text-sm font-semibold">문의 내용</label><textarea id="description" name="description" rows={7} maxLength={5000} value={draft.description} onChange={event => update('description', event.target.value)} placeholder="예: 3층 복도 유도등에 불이 들어오지 않습니다. 점검과 교체 상담을 받고 싶어요." aria-required="true" aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error description-hint' : 'description-hint'} className={`${control} resize-y leading-7 ${errors.description ? 'border-red-600' : 'border-slate-300'}`} /><p id="description-hint" className="mt-2 text-xs leading-5 text-slate-500">주민등록번호 등 상담에 불필요한 개인정보는 적지 마세요. <span className="whitespace-nowrap">{draft.description.length.toLocaleString()} / 5,000자</span></p>{errors.description && <p id="description-error" role="alert" className="mt-2 text-sm text-red-700">{errors.description}</p>}</div>
          {field('preferredWorkDate', '공사 희망일', { optional: true, type: 'date' })}
          <p className="text-xs leading-6 text-slate-500">희망일은 확정 일정이 아닙니다. 상담 후 일정을 조율합니다.</p>
        </>}
        {step === 3 && <>
          {field('customerName', '고객명', { maxLength: 50, autoComplete: 'name' })}
          {field('phone', '연락처', { type: 'tel', inputMode: 'tel', maxLength: 30, autoComplete: 'tel', placeholder: '010-0000-0000' })}
          <div><label htmlFor="preferredContactTime" className="mb-2 block text-sm font-semibold">희망 연락시간 <span className="ml-2 font-normal text-slate-400">선택</span></label><select id="preferredContactTime" value={draft.preferredContactTime} onChange={event => update('preferredContactTime', event.target.value)} className={`${control} border-slate-300`}>{contactTimes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          {draft.preferredContactTime === 'CUSTOM' && field('preferredContactDetail', '희망 연락시간 직접 입력', { maxLength: 100, placeholder: '예: 평일 오후 2시 이후' })}
        </>}
        {step === 4 && <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4"><span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-white"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m4 10 4 4 8-8"/></svg></span><h3 className="font-bold">접수 내용</h3></div>
            <dl className="divide-y divide-slate-200 px-5 text-sm leading-6">
            {[
              ['문의 유형', inquiryTypes.find(item => item.value === draft.inquiryType)?.label],
              ['현장 주소', [draft.address, draft.addressDetail].filter(Boolean).join(' ')],
              ['업체명 / 건물명', draft.companyName || '미입력'],
              ['문의 내용', draft.description], ['공사 희망일', draft.preferredWorkDate || '미정'],
              ['고객명', draft.customerName], ['연락처', draft.phone],
              ['희망 연락시간', draft.preferredContactTime === 'CUSTOM' ? draft.preferredContactDetail : contactTimes.find(item => item.value === draft.preferredContactTime)?.label],
            ].map(([label, value]) => <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[8rem_minmax(0,1fr)]"><dt className="font-semibold text-slate-500">{label}</dt><dd className="whitespace-pre-wrap break-words text-right font-medium text-slate-900 [overflow-wrap:anywhere]">{value}</dd></div>)}
            </dl>
          </div>
          <div className="border-t border-slate-200 pt-5"><h3 className="mb-4 text-base font-bold">개인정보 수집·이용 안내</h3><PrivacySummary notice={notice}/><Link href="/privacy" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">개인정보 안내 전체 보기 (새 창)</Link></div>
          <label className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-4 ${errors.privacyAgreed ? 'border-red-600' : 'border-slate-200'}`}><input id="privacyAgreed" type="checkbox" checked={draft.privacyAgreed} onChange={event => update('privacyAgreed', event.target.checked)} aria-required="true" aria-invalid={!!errors.privacyAgreed} aria-describedby={errors.privacyAgreed ? 'privacyAgreed-error' : undefined} className="mt-1 size-5 shrink-0 accent-red-700"/><span className="text-sm font-semibold leading-6">[필수] 개인정보 수집·이용에 동의합니다.</span></label>
          {errors.privacyAgreed && <p id="privacyAgreed-error" role="alert" className="text-sm text-red-700">{errors.privacyAgreed}</p>}
        </>}
      </fieldset>
      {message && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{message}{conflict && <button type="button" onClick={() => { clearRequestKey(); setDraft(initialDraft(notice.version)); setConflict(false); move(0); }} className="mt-3 block min-h-11 font-bold underline">입력을 지우고 새 접수 시작</button>}</div>}
    </section>
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><div className="mx-auto flex max-w-2xl gap-3">{step > 0 && <button type="button" onClick={() => move(step - 1)} disabled={pending} className="min-h-14 w-24 rounded-xl border border-slate-300 font-semibold disabled:opacity-50">이전</button>}<button type="submit" disabled={pending} className="min-h-14 flex-1 rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-800 disabled:opacity-60">{pending ? '접수 중…' : step === 4 ? '상담 접수하기' : '다음'}</button></div></div>
  </form>;
}
