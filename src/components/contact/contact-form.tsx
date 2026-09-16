'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PrivacyNotice } from '@/lib/privacy';
import { inquiryErrors, inquirySchema, inquiryTypes, contactTimes, stepFields, type InquiryDraft } from '@/validations/inquiry';
import { PrivacySummary } from './privacy-summary';
import { PhotoPicker, type SelectedPhoto } from './photo-picker';
import { uploadPhotos } from './upload-photos';
import { trackEvent } from '@/components/public/analytics';
const steps = ['문의 유형', '현장 정보', '문의 내용', '연락 정보', '확인 및 동의'];
const initialDraft = (version: string): InquiryDraft => ({
  inquiryType: '', customerName: '', phone: '', companyName: '', postalCode: '', address: '',
  addressDetail: '', description: '', preferredContactTime: 'ANYTIME', preferredContactDetail: '',
  preferredWorkDate: '', privacyAgreed: false, privacyPolicyVersion: version,
});
const control = 'min-h-13 w-full rounded-xl border bg-white px-4 py-3 text-base outline-offset-2';
const keyStorage = 'okfire-inquiry-request-key';
export function ContactForm({ notice, uploadsEnabled = false }: { notice: PrivacyNotice; uploadsEnabled?: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<InquiryDraft>(() => initialDraft(notice.version));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const uploaded = useRef(new Set<string>());
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
    let createdId = inquiryId;
    try {
      if (!createdId) {
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
        createdId = result.data.id; setInquiryId(createdId);
      }
      if (createdId && photos.length) await uploadPhotos(createdId, getRequestKey(), photos, uploaded.current, value => { setProgress(value); setUploadedCount(uploaded.current.size); });
      finish();
    } catch { setMessage(createdId ? '상담은 접수되었지만 일부 사진의 저장 결과를 확인하지 못했습니다. 사진 업로드를 다시 시도하거나 저장된 사진으로 완료해주세요.' : '접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 접수하면 같은 요청의 중복 저장을 방지합니다.'); }
    finally { setUploadedCount(uploaded.current.size); if (!completed.current) { submitting.current = false; setPending(false); } }
  }
  function field(id: keyof InquiryDraft, label: string, options: { optional?: boolean; type?: string; maxLength?: number; autoComplete?: string; inputMode?: 'numeric' | 'tel'; placeholder?: string } = {}) {
    return <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}{options.optional && <span className="ml-2 font-normal text-slate-400">선택</span>}</label>
      <input id={id} name={id} value={String(draft[id])} onChange={event => update(id, event.target.value)} type={options.type ?? 'text'} maxLength={options.maxLength} autoComplete={options.autoComplete} inputMode={options.inputMode} placeholder={options.placeholder} aria-required={!options.optional} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-error` : undefined} className={`${control} ${errors[id] ? 'border-red-600' : 'border-slate-300'}`} />
      {errors[id] && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">{errors[id]}</p>}
    </div>;
  }
  return <form noValidate onSubmit={submit} className="mt-8" aria-busy={pending}>
    <nav aria-label="접수 진행 단계"><ol className="flex gap-1.5 sm:gap-3">{steps.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className="min-w-0 flex-1"><span className={`mb-2 block h-1.5 rounded-full ${index <= step ? 'bg-red-700' : 'bg-slate-200'}`}/><span className={`text-[11px] sm:text-xs ${index === step ? 'font-bold text-red-700' : 'text-slate-500'}`}>{index + 1}. {label}</span></li>)}</ol></nav>
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-xs font-bold text-red-700">STEP {step + 1} / 5</p>
      <h2 ref={heading} tabIndex={-1} className="mt-3 text-2xl font-bold tracking-tight outline-none">{['어떤 도움이 필요하세요?', '어느 현장인가요?', '현장 상황을 알려주세요.', '어떻게 연락드릴까요?', '내용을 확인해주세요.'][step]}</h2>
      <fieldset disabled={pending || !!inquiryId} className="mt-6 space-y-5">
        <legend className="sr-only">{steps[step]}</legend>
        {step === 0 && <>
          <p className="text-sm leading-6 text-slate-500">가장 가까운 유형을 하나 선택해주세요.</p>
          <div id="inquiryType" tabIndex={-1} role="radiogroup" aria-label="문의 유형" aria-required="true" aria-describedby={errors.inquiryType ? 'inquiryType-error' : undefined} className="grid gap-3 sm:grid-cols-2">{inquiryTypes.map(item => <label key={item.value} className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border p-4 has-focus-visible:ring-2 has-focus-visible:ring-red-700 ${draft.inquiryType === item.value ? 'border-red-700 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="inquiryType" value={item.value} checked={draft.inquiryType === item.value} onChange={() => update('inquiryType', item.value)} className="mt-1 size-4 shrink-0 accent-red-700"/><span><strong className="block text-base">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span></label>)}</div>
          {errors.inquiryType && <p id="inquiryType-error" role="alert" className="text-sm text-red-700">{errors.inquiryType}</p>}
        </>}
        {step === 1 && <>
          {field('address', '현장 주소', { maxLength: 255, placeholder: '시·군·구와 도로명 또는 지번 주소', autoComplete: 'off' })}
          {field('addressDetail', '상세주소', { optional: true, maxLength: 255, placeholder: '동·호수, 층 등', autoComplete: 'off' })}
          {field('postalCode', '우편번호', { optional: true, maxLength: 5, inputMode: 'numeric', autoComplete: 'off' })}
          {field('companyName', '업체명 / 건물명', { optional: true, maxLength: 100, autoComplete: 'organization' })}
        </>}
        {step === 2 && <>
          <div><label htmlFor="description" className="mb-2 block text-sm font-semibold">문의 내용</label><textarea id="description" name="description" rows={7} maxLength={5000} value={draft.description} onChange={event => update('description', event.target.value)} placeholder="예: 3층 복도 유도등에 불이 들어오지 않습니다. 점검과 교체 상담을 받고 싶어요." aria-required="true" aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error description-hint' : 'description-hint'} className={`${control} resize-y leading-7 ${errors.description ? 'border-red-600' : 'border-slate-300'}`} /><p id="description-hint" className="mt-2 text-xs leading-5 text-slate-500">주민등록번호 등 상담에 불필요한 개인정보는 적지 마세요. <span className="whitespace-nowrap">{draft.description.length.toLocaleString()} / 5,000자</span></p>{errors.description && <p id="description-error" role="alert" className="mt-2 text-sm text-red-700">{errors.description}</p>}</div>
          {field('preferredWorkDate', '공사 희망일', { optional: true, type: 'date' })}
          <p className="text-xs leading-6 text-slate-500">희망일은 확정 일정이 아닙니다. 상담 후 일정을 조율합니다.</p>
          {uploadsEnabled ? <PhotoPicker photos={photos} onChange={setPhotos}/> : <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">사진 업로드를 준비하고 있습니다. 글로 현장 상황을 알려주세요.</p>}
        </>}
        {step === 3 && <>
          {field('customerName', '고객명', { maxLength: 50, autoComplete: 'name' })}
          {field('phone', '연락처', { type: 'tel', inputMode: 'tel', maxLength: 30, autoComplete: 'tel', placeholder: '010-0000-0000' })}
          <div><label htmlFor="preferredContactTime" className="mb-2 block text-sm font-semibold">희망 연락시간 <span className="ml-2 font-normal text-slate-400">선택</span></label><select id="preferredContactTime" value={draft.preferredContactTime} onChange={event => update('preferredContactTime', event.target.value)} className={`${control} border-slate-300`}>{contactTimes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          {draft.preferredContactTime === 'CUSTOM' && field('preferredContactDetail', '희망 연락시간 직접 입력', { maxLength: 100, placeholder: '예: 평일 오후 2시 이후' })}
        </>}
        {step === 4 && <>
          <dl className="space-y-4 rounded-xl bg-slate-50 p-5 text-sm leading-6">
            {[
              ['문의 유형', inquiryTypes.find(item => item.value === draft.inquiryType)?.label],
              ['현장 주소', [draft.address, draft.addressDetail].filter(Boolean).join(' ')],
              ['업체명 / 건물명', draft.companyName || '미입력'], ['우편번호', draft.postalCode || '미입력'],
              ['문의 내용', draft.description], ['공사 희망일', draft.preferredWorkDate || '미정'],
              ['고객명', draft.customerName], ['연락처', draft.phone],
              ['희망 연락시간', draft.preferredContactTime === 'CUSTOM' ? draft.preferredContactDetail : contactTimes.find(item => item.value === draft.preferredContactTime)?.label],
            ].map(([label, value]) => <div key={label}><dt className="font-semibold text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{value}</dd></div>)}
          </dl>
          {!!photos.length && <PhotoPicker photos={photos} onChange={setPhotos} readOnly/>}
          <div className="border-t border-slate-200 pt-5"><h3 className="mb-4 text-base font-bold">개인정보 수집·이용 안내</h3><PrivacySummary notice={notice}/><Link href="/privacy" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">개인정보 안내 전체 보기 (새 창)</Link></div>
          <label className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-4 ${errors.privacyAgreed ? 'border-red-600' : 'border-slate-200'}`}><input id="privacyAgreed" type="checkbox" checked={draft.privacyAgreed} onChange={event => update('privacyAgreed', event.target.checked)} aria-required="true" aria-invalid={!!errors.privacyAgreed} aria-describedby={errors.privacyAgreed ? 'privacyAgreed-error' : undefined} className="mt-1 size-5 shrink-0 accent-red-700"/><span className="text-sm font-semibold leading-6">[필수] 개인정보 수집·이용에 동의합니다.</span></label>
          {errors.privacyAgreed && <p id="privacyAgreed-error" role="alert" className="text-sm text-red-700">{errors.privacyAgreed}</p>}
        </>}
      </fieldset>
      {!!inquiryId && <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">상담 내용은 접수되었습니다. 저장 확인된 사진: {uploadedCount}/{photos.length}장.{pending && <p>{progress}</p>}{!pending && <button type="button" onClick={finish} className="mt-3 min-h-11 font-semibold underline">저장된 사진으로 접수 완료</button>}</div>}
      {message && <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{message}{conflict && <button type="button" onClick={() => { clearRequestKey(); setDraft(initialDraft(notice.version)); setConflict(false); move(0); }} className="mt-3 block min-h-11 font-bold underline">입력을 지우고 새 접수 시작</button>}</div>}
    </section>
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><div className="mx-auto flex max-w-2xl gap-3">{step > 0 && <button type="button" onClick={() => move(step - 1)} disabled={pending || !!inquiryId} className="min-h-14 w-24 rounded-xl border border-slate-300 font-semibold disabled:opacity-50">이전</button>}<button type="submit" disabled={pending} className="min-h-14 flex-1 rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-800 disabled:opacity-60">{pending ? (progress || '접수 중…') : inquiryId ? '사진 업로드 다시 시도' : step === 4 ? '상담 접수하기' : '다음'}</button></div></div>
  </form>;
}
