import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import type { AdminInquiryQuery } from '@/validations/admin-inquiry';
import { ApiError } from '@/lib/http';
import { formatDateTime } from '@/lib/admin-inquiry';

function dayStart(value: string) { return new Date(`${value}T00:00:00+09:00`); }
function dayAfter(value: string) { const date = dayStart(value); date.setUTCDate(date.getUTCDate() + 1); return date; }
function id(value: string) {
  if (!/^[1-9]\d{0,18}$/.test(value)) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
  const parsed = BigInt(value);
  if (parsed > BigInt('9223372036854775807')) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
  return parsed;
}

type Viewer = { id: string; role: 'SUPER_ADMIN'|'MANAGER'; customerPiiAccess: boolean };
function mayViewPii(viewer: Viewer, assignedAdminId: bigint | null) { return viewer.role === 'SUPER_ADMIN' || viewer.customerPiiAccess || assignedAdminId === BigInt(viewer.id); }
function maskedPhone(value: string) { const digits=value.replace(/\D/g,''); return digits.length >= 7 ? `${digits.slice(0,3)}-****-${digits.slice(-4)}` : '***'; }
function maskedName(value: string) { return value.length > 1 ? `${value.slice(0,1)}*` : '*'; }
function maskedAddress(value: string) { return value.split(' ').slice(0,2).join(' ') || '주소 비공개'; }
export async function listAdminInquiries(query: AdminInquiryQuery, viewer: Viewer) {
  const keyword = query.keyword?.trim();
  const digits = keyword?.replace(/\D/g, '');
  const where: Prisma.InquiryWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.inquiryType ? { inquiryType: query.inquiryType } : {}),
    ...(query.assignedAdminId ? { assignedAdminId: BigInt(query.assignedAdminId) } : {}),
    ...((query.from || query.to) ? { createdAt: { ...(query.from ? { gte: dayStart(query.from) } : {}), ...(query.to ? { lt: dayAfter(query.to) } : {}) } } : {}),
    ...(keyword ? { OR: [
      { customerName: { contains: keyword, mode: 'insensitive' } },
      { inquiryNumber: { contains: keyword, mode: 'insensitive' } },
      { companyName: { contains: keyword, mode: 'insensitive' } },
      { address: { contains: keyword, mode: 'insensitive' } },
      { addressDetail: { contains: keyword, mode: 'insensitive' } },
      ...(viewer.role === 'SUPER_ADMIN' || viewer.customerPiiAccess ? (digits && digits.length >= 2 ? [{ phone: { contains: digits } } as const] : []) : []),
    ] } : {}),
  };
  const orderBy: Prisma.InquiryOrderByWithRelationInput = { [query.sort]: query.order };
  const [total, rows, admins] = await db().$transaction([
    db().inquiry.count({ where }),
    db().inquiry.findMany({
      where, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: [orderBy, { id: 'desc' }],
      select: {
        id: true, inquiryNumber: true, customerName: true, phone: true, companyName: true, address: true,
        addressDetail: true, inquiryType: true, status: true, createdAt: true,
        assignedAdmin: { select: { id: true, name: true } },
        _count: { select: { inquiryAttachmentsByInquiryId: { where: { deletedAt: null } } } },
      },
    }),
    db().admin.findMany({ where: { status: 'ACTIVE', deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);
  await db().adminActivityLog.create({ data: { adminId: BigInt(viewer.id), actionType: 'INQUIRY_LIST_VIEW' } });
  return {
    items: rows.map(row => { const pii=mayViewPii(viewer,row.assignedAdmin?.id ?? null); return {
      id: row.id.toString(), inquiryNumber: row.inquiryNumber, customerName: pii ? row.customerName : maskedName(row.customerName), phone: pii ? row.phone : maskedPhone(row.phone),
      companyName: pii ? row.companyName : null, address: pii ? row.address : maskedAddress(row.address), addressDetail: pii ? row.addressDetail : null, pii,
      inquiryType: row.inquiryType, status: row.status, createdAt: row.createdAt.toISOString(),
      assignedAdmin: row.assignedAdmin ? { id: row.assignedAdmin.id.toString(), name: row.assignedAdmin.name } : null,
      attachmentCount: row._count.inquiryAttachmentsByInquiryId,
    }; }),
    pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    admins: admins.map(admin => ({ id: admin.id.toString(), name: admin.name })),
  };
}

export async function getAdminInquiryDetail(value: string, viewer: Viewer) {
  const inquiry = await db().inquiry.findFirst({
    where: { id: id(value), deletedAt: null },
    include: {
      assignedAdmin: { select: { id: true, name: true } },
      inquiryAttachmentsByInquiryId: { where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      inquiryNotesByInquiryId: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { admin: { select: { id: true, name: true } } } },
      inquiryStatusHistoriesByInquiryId: { orderBy: { createdAt: 'desc' }, include: { changedByAdmin: { select: { id: true, name: true } } } },
      inquiryAssignmentHistoriesByInquiryId: { orderBy: { createdAt: 'desc' }, include: { previousAdmin: { select: { id: true, name: true } }, newAdmin: { select: { id: true, name: true } }, changedByAdmin: { select: { id: true, name: true } } } },
      visitsByInquiryId: { where: { deletedAt: null }, orderBy: [{ visitDate: 'desc' }, { visitTime: 'desc' }], include: { assignedAdmin: { select: { id: true, name: true } } } },
      estimatesByInquiryId: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { createdByAdmin: { select: { id: true, name: true } } } },
    },
  });
  if (!inquiry) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
  if (!mayViewPii(viewer, inquiry.assignedAdminId)) throw new ApiError(403, 'FORBIDDEN', '담당자 또는 개인정보 열람 권한이 있는 관리자만 상세를 볼 수 있습니다.');
  const availableAdmins = await db().admin.findMany({ where: { status: 'ACTIVE', deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } });
  await db().adminActivityLog.create({ data: { adminId: BigInt(viewer.id), actionType: 'PII_VIEW', targetType: 'INQUIRY', targetId: inquiry.id } });
  return {
    id: inquiry.id.toString(), inquiryNumber: inquiry.inquiryNumber, customerName: inquiry.customerName, phone: inquiry.phone,
    companyName: inquiry.companyName, postalCode: inquiry.postalCode, address: inquiry.address, addressDetail: inquiry.addressDetail,
    inquiryType: inquiry.inquiryType, description: inquiry.description, preferredContactTime: inquiry.preferredContactTime,
    preferredContactDetail: inquiry.preferredContactDetail,
    preferredWorkDate: inquiry.preferredWorkDate ? inquiry.preferredWorkDate.toISOString().slice(0, 10) : null,
    status: inquiry.status, assignedAdmin: inquiry.assignedAdmin ? { id: inquiry.assignedAdmin.id.toString(), name: inquiry.assignedAdmin.name } : null,
    privacyPolicyVersion: inquiry.privacyPolicyVersion, privacyAgreedAt: inquiry.privacyAgreedAt.toISOString(), source: inquiry.source,
    createdAt: inquiry.createdAt.toISOString(), updatedAt: inquiry.updatedAt.toISOString(),
    attachments: inquiry.inquiryAttachmentsByInquiryId.map(item => ({ id: item.id.toString(), originalName: item.originalName, mimeType: item.mimeType, fileSize: item.fileSize.toString(), attachmentType: item.attachmentType, estimateId: item.estimateId?.toString() ?? null, createdAt: item.createdAt.toISOString() })),
    notes: inquiry.inquiryNotesByInquiryId.map(item => ({ id: item.id.toString(), content: item.content, admin: { id: item.admin.id.toString(), name: item.admin.name }, createdAt: item.createdAt.toISOString(), createdAtLabel: formatDateTime(item.createdAt), updatedAt: item.updatedAt.toISOString() })),
    statusHistory: inquiry.inquiryStatusHistoriesByInquiryId.map(item => ({ id: item.id.toString(), previousStatus: item.previousStatus, newStatus: item.newStatus, memo: item.memo, changedByAdmin: item.changedByAdmin ? { id: item.changedByAdmin.id.toString(), name: item.changedByAdmin.name } : null, createdAt: item.createdAt.toISOString() })),
    assignmentHistory: inquiry.inquiryAssignmentHistoriesByInquiryId.map(item => ({ id: item.id.toString(), previousAdmin: item.previousAdmin ? { id: item.previousAdmin.id.toString(), name: item.previousAdmin.name } : null, newAdmin: item.newAdmin ? { id: item.newAdmin.id.toString(), name: item.newAdmin.name } : null, changedByAdmin: { id: item.changedByAdmin.id.toString(), name: item.changedByAdmin.name }, createdAt: item.createdAt.toISOString() })),
    availableAdmins: availableAdmins.map(item => ({ id: item.id.toString(), name: item.name })),
    visits: inquiry.visitsByInquiryId.map(item => ({ id: item.id.toString(), visitDate: item.visitDate.toISOString().slice(0, 10), visitTime: item.visitTime?.toISOString() ?? null, address: item.address, addressDetail: item.addressDetail, memo: item.memo, status: item.status, assignedAdmin: item.assignedAdmin ? { id: item.assignedAdmin.id.toString(), name: item.assignedAdmin.name } : null })),
    estimates: inquiry.estimatesByInquiryId.map(item => ({ id: item.id.toString(), amount: item.amount?.toString() ?? null, memo: item.memo, status: item.status, createdByAdmin: { id: item.createdByAdmin.id.toString(), name: item.createdByAdmin.name }, createdAt: item.createdAt.toISOString() })),
  };
}
