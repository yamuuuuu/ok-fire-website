import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/session';
import { listAdminInquiries } from '@/services/admin-inquiries';
import { adminInquiryQuerySchema, queryObject, type AdminInquiryQuery } from '@/validations/admin-inquiry';
import { displayPhone, formatDateTime, fullAddress, inquiryTypeLabel, INQUIRY_STATUSES, INQUIRY_TYPES, phoneHref, statusLabel, statusTone } from '@/lib/admin-inquiry';

export const metadata: Metadata = { title: '접수관리' };
function urlFor(query: AdminInquiryQuery, changes: Partial<Record<keyof AdminInquiryQuery, string | number | undefined>>) {
  const params = new URLSearchParams();
  const values = { ...query, ...changes };
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') params.set(key, String(value));
  return `/admin/inquiries?${params.toString()}`;
}

export default async function InquiryListPage({ searchParams }: PageProps<'/admin/inquiries'>) {
  const admin = await requireAdmin();
  const parsed = adminInquiryQuerySchema.safeParse(queryObject(await searchParams));
  const query = parsed.success ? parsed.data : adminInquiryQuerySchema.parse({});
  const data = await listAdminInquiries(query, admin.id);
  const fromItem = data.pagination.total ? (query.page - 1) * query.pageSize + 1 : 0;
  const toItem = Math.min(query.page * query.pageSize, data.pagination.total);
  return <>
    <p className="text-sm font-medium text-slate-500">고객 상담</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold tracking-tight">접수관리</h1><p className="mt-2 text-sm text-slate-600">총 {data.pagination.total.toLocaleString('ko-KR')}건</p></div></div>
    {!parsed.success && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">검색 조건이 올바르지 않아 기본 목록을 표시했습니다.</p>}
    <form method="get" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <label className="block text-sm font-bold" htmlFor="keyword">통합 검색</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id="keyword" name="keyword" defaultValue={query.keyword} maxLength={100} placeholder="고객명, 전화번호, 접수번호, 업체명, 주소" className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-base"/><button className="min-h-12 rounded-xl bg-slate-900 px-6 font-bold text-white">검색</button></div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <label className="text-xs font-semibold text-slate-600">상태<select name="status" defaultValue={query.status ?? ''} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">전체</option>{INQUIRY_STATUSES.map(value => <option key={value} value={value}>{statusLabel[value]}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">문의유형<select name="inquiryType" defaultValue={query.inquiryType ?? ''} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">전체</option>{INQUIRY_TYPES.map(value => <option key={value} value={value}>{inquiryTypeLabel[value]}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">담당자<select name="assignedAdminId" defaultValue={query.assignedAdminId ?? ''} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">전체</option>{data.admins.map(admin => <option key={admin.id} value={admin.id}>{admin.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">시작일<input type="date" name="from" defaultValue={query.from} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"/></label>
        <label className="text-xs font-semibold text-slate-600">종료일<input type="date" name="to" defaultValue={query.to} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"/></label>
        <label className="text-xs font-semibold text-slate-600">표시 개수<select name="pageSize" defaultValue={query.pageSize} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{[20, 50, 100].map(value => <option key={value} value={value}>{value}개</option>)}</select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">정렬<select name="sort" defaultValue={query.sort} className="mt-1 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="createdAt">접수일</option><option value="inquiryNumber">접수번호</option><option value="customerName">고객명</option><option value="status">상태</option></select></label>
        <label className="text-xs font-semibold text-slate-600">순서<select name="order" defaultValue={query.order} className="mt-1 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="desc">내림차순</option><option value="asc">오름차순</option></select></label>
        <input type="hidden" name="page" value="1"/><button className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold">필터 적용</button><Link href="/admin/inquiries" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-slate-600">초기화</Link>
      </div>
    </form>

    {data.items.length ? <>
      <div className="mt-5 space-y-3 lg:hidden">{data.items.map(item => <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${item.status === 'NEW' ? 'border-red-200' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between gap-3"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusTone(item.status)}`}>{statusLabel[item.status]}</span><h2 className="mt-3 text-xl font-bold">{item.customerName}</h2></div><span className="text-xs text-slate-500">{item.inquiryNumber}</span></div>
        <a href={phoneHref(item.phone)} className="mt-2 inline-flex min-h-11 items-center text-lg font-bold text-red-800">{displayPhone(item.phone)}</a>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{fullAddress(item.address, item.addressDetail)}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{inquiryTypeLabel[item.inquiryType]}</span><span>{formatDateTime(item.createdAt)}</span><span>사진 {item.attachmentCount}장</span><span>{item.assignedAdmin?.name ?? '미배정'}</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><a href={phoneHref(item.phone)} className="flex min-h-12 items-center justify-center rounded-xl border border-red-200 font-bold text-red-800">전화</a><Link href={`/admin/inquiries/${item.id}`} className="flex min-h-12 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">상세</Link></div>
      </article>)}</div>
      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="px-5 py-4">상태 / 접수번호</th><th className="px-5 py-4">고객</th><th className="px-5 py-4">현장 / 문의유형</th><th className="px-5 py-4">담당자</th><th className="px-5 py-4">접수일</th><th className="px-5 py-4"><span className="sr-only">상세</span></th></tr></thead><tbody className="divide-y divide-slate-100">{data.items.map(item => <tr key={item.id} className={item.status === 'NEW' ? 'bg-red-50/30' : ''}><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusTone(item.status)}`}>{statusLabel[item.status]}</span><div className="mt-2 text-xs text-slate-500">{item.inquiryNumber}</div></td><td className="px-5 py-4"><div className="font-bold">{item.customerName}</div><a href={phoneHref(item.phone)} className="mt-1 inline-block font-semibold text-red-800">{displayPhone(item.phone)}</a>{item.companyName && <div className="mt-1 text-xs text-slate-500">{item.companyName}</div>}</td><td className="max-w-xs px-5 py-4"><div className="truncate">{fullAddress(item.address, item.addressDetail)}</div><div className="mt-1 text-xs text-slate-500">{inquiryTypeLabel[item.inquiryType]} · 사진 {item.attachmentCount}장</div></td><td className="px-5 py-4">{item.assignedAdmin?.name ?? <span className="text-slate-400">미배정</span>}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td><td className="px-5 py-4"><Link href={`/admin/inquiries/${item.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 font-bold">상세</Link></td></tr>)}</tbody></table></div>
    </> : <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-bold">조건에 맞는 접수가 없습니다.</h2><p className="mt-2 text-sm text-slate-500">검색어나 필터를 변경해보세요.</p></section>}

    <nav aria-label="접수 목록 페이지" className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-slate-500">{fromItem.toLocaleString('ko-KR')}–{toItem.toLocaleString('ko-KR')} / {data.pagination.total.toLocaleString('ko-KR')}</span><div className="flex gap-2">{query.page > 1 ? <Link href={urlFor(query, { page: query.page - 1 })} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 font-bold">이전</Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 text-slate-400">이전</span>}<span className="inline-flex min-h-11 items-center px-2 font-semibold">{query.page} / {Math.max(1, data.pagination.totalPages)}</span>{query.page < data.pagination.totalPages ? <Link href={urlFor(query, { page: query.page + 1 })} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 font-bold">다음</Link> : <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 text-slate-400">다음</span>}</div></nav>
  </>;
}
