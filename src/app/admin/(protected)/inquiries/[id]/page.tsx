import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProtectedImage } from '@/components/admin/protected-image';
import { InquiryOperations } from '@/components/admin/inquiry-operations';
import { VisitEstimateOperations } from '@/components/admin/visit-estimate-operations';
import { ApiError } from '@/lib/http';
import { displayPhone, formatDate, formatDateTime, fullAddress, inquiryTypeLabel, phoneHref, preferredContactLabel, statusLabel, statusTone } from '@/lib/admin-inquiry';
import { requireAdmin } from '@/lib/session';
import { getAdminInquiryDetail } from '@/services/admin-inquiries';

export const metadata: Metadata = { title: '접수 상세' };
function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold">{title}</h2><div className="mt-4">{children}</div></section>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{children}</p>; }

export default async function InquiryDetailPage({ params }: PageProps<'/admin/inquiries/[id]'>) {
  const admin = await requireAdmin();
  let inquiry: Awaited<ReturnType<typeof getAdminInquiryDetail>>;
  try { inquiry = await getAdminInquiryDetail((await params).id, admin); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
  const address = fullAddress(inquiry.address, inquiry.addressDetail);
  const customerAttachments = inquiry.attachments.filter(item => item.attachmentType === 'CUSTOMER');
  const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(address)}`;
  const contact = inquiry.preferredContactTime ? `${preferredContactLabel[inquiry.preferredContactTime] ?? inquiry.preferredContactTime}${inquiry.preferredContactDetail ? ` · ${inquiry.preferredContactDetail}` : ''}` : '선택하지 않음';
  return <div className="pb-20 lg:pb-0">
    <Link href="/admin/inquiries" className="inline-flex min-h-11 items-center text-sm font-bold text-slate-600">← 접수목록</Link>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">{inquiry.inquiryNumber}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{inquiry.customerName}</h1><p className="mt-2 text-sm text-slate-500">{formatDateTime(inquiry.createdAt)} 접수</p></div><span className={`inline-flex rounded-full px-3 py-2 text-sm font-bold ring-1 ring-inset ${statusTone(inquiry.status)}`}>{statusLabel[inquiry.status]}</span></div>

    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
      <div className="space-y-5">
        <Card title="고객정보"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-500">고객명</dt><dd className="mt-1 font-bold">{inquiry.customerName}</dd></div><div><dt className="text-xs font-semibold text-slate-500">업체·건물명</dt><dd className="mt-1">{inquiry.companyName ?? '미입력'}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">연락처</dt><dd><a href={phoneHref(inquiry.phone)} className="mt-1 inline-flex min-h-11 items-center text-xl font-bold text-red-800">{displayPhone(inquiry.phone)}</a></dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">희망 연락시간</dt><dd className="mt-1">{contact}</dd></div></dl></Card>
        <Card title="현장주소"><p className="leading-7">{inquiry.postalCode && <span className="mr-2 text-sm text-slate-500">({inquiry.postalCode})</span>}{address}</p><a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-bold">지도에서 보기 ↗</a></Card>
        <Card title="문의내용"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{inquiryTypeLabel[inquiry.inquiryType]}</span>{inquiry.preferredWorkDate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">희망 공사일 {formatDate(`${inquiry.preferredWorkDate}T00:00:00+09:00`)}</span>}</div><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{inquiry.description}</p></Card>
        <Card title={`고객사진 ${customerAttachments.length}장`}>{customerAttachments.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{customerAttachments.map((photo, index) => <figure key={photo.id}><ProtectedImage id={photo.id} name={`고객 현장 사진 ${index + 1}`}/><figcaption className="mt-2 truncate text-xs text-slate-500" title={photo.originalName}>{photo.originalName}</figcaption></figure>)}</div> : <Empty>첨부된 고객 사진이 없습니다.</Empty>}</Card>
        <InquiryOperations inquiryId={inquiry.id} status={inquiry.status} assigneeId={inquiry.assignedAdmin?.id ?? null} admins={inquiry.availableAdmins} currentAdmin={admin} notes={inquiry.notes}/>
        <VisitEstimateOperations inquiryId={inquiry.id} admins={inquiry.availableAdmins} visits={inquiry.visits} estimates={inquiry.estimates} attachments={inquiry.attachments} address={inquiry.address} addressDetail={inquiry.addressDetail}/>
      </div>

      <div className="space-y-5">
        <Card title="접수 상태"><dl className="space-y-4"><div><dt className="text-xs font-semibold text-slate-500">현재 상태</dt><dd className="mt-2"><span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ring-1 ring-inset ${statusTone(inquiry.status)}`}>{statusLabel[inquiry.status]}</span></dd></div><div><dt className="text-xs font-semibold text-slate-500">담당자</dt><dd className="mt-1 font-semibold">{inquiry.assignedAdmin?.name ?? '미배정'}</dd></div><div><dt className="text-xs font-semibold text-slate-500">최근 수정</dt><dd className="mt-1 text-sm">{formatDateTime(inquiry.updatedAt)}</dd></div></dl></Card>
        <Card title="방문일정">{inquiry.visits.length ? <ul className="space-y-3">{inquiry.visits.map(visit => <li key={visit.id} className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{formatDate(`${visit.visitDate}T00:00:00+09:00`)}</strong><p className="mt-1 text-slate-600">{fullAddress(visit.address, visit.addressDetail)}</p></li>)}</ul> : <Empty>등록된 방문일정이 없습니다.</Empty>}</Card>
        <Card title="견적">{inquiry.estimates.length ? <ul className="space-y-3">{inquiry.estimates.map(estimate => <li key={estimate.id} className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{estimate.amount ? `${Number(estimate.amount).toLocaleString('ko-KR')}원` : '금액 미정'}</strong><p className="mt-1 text-slate-500">{estimate.createdByAdmin.name} · {formatDateTime(estimate.createdAt)}</p></li>)}</ul> : <Empty>등록된 견적이 없습니다.</Empty>}</Card>
        <Card title="접수 이력"><ol className="space-y-4">{inquiry.statusHistory.map(history => <li key={history.id} className="relative border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">상태: {statusLabel[history.newStatus]}</p><p className="mt-1 text-xs text-slate-500">{history.changedByAdmin?.name ?? '고객 접수'} · {formatDateTime(history.createdAt)}</p>{history.memo && <p className="mt-2 text-sm text-slate-700">{history.memo}</p>}</li>)}{inquiry.assignmentHistory.map(history => <li key={history.id} className="relative border-l-2 border-slate-200 pl-4"><p className="text-sm font-bold">담당자: {history.previousAdmin?.name ?? '미배정'} → {history.newAdmin?.name ?? '미배정'}</p><p className="mt-1 text-xs text-slate-500">{history.changedByAdmin.name} · {formatDateTime(history.createdAt)}</p></li>)}</ol></Card>
        <Card title="접수 정보"><dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-500">접수 경로</dt><dd>{inquiry.source}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">동의 시각</dt><dd>{formatDateTime(inquiry.privacyAgreedAt)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">동의 버전</dt><dd className="break-all text-right">{inquiry.privacyPolicyVersion ?? '기록 없음'}</dd></div></dl></Card>
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-[72px] z-20 border-t border-slate-200 bg-white p-3 pb-3 lg:hidden"><div className="mx-auto grid max-w-md grid-cols-2 gap-3"><a href={phoneHref(inquiry.phone)} className="flex min-h-12 items-center justify-center rounded-xl bg-red-700 font-bold text-white">전화하기</a><a href="#operations" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 font-bold">상태 변경</a></div></div>
  </div>;
}
