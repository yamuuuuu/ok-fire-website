import 'server-only';
import type { AdminRole, InquiryStatus } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/http';
import { databaseId } from '@/services/attachments';

export async function changeInquiryStatus(value: string, adminId: string, status: InquiryStatus, memo?: string) {
  const inquiryId = databaseId(value);
  return db().$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: bigint; status: InquiryStatus }[]>`SELECT id, status FROM inquiries WHERE id = ${inquiryId} AND deleted_at IS NULL FOR UPDATE`;
    if (!rows.length) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
    const previousStatus = rows[0].status;
    if (previousStatus === status) return { status, changed: false };
    await tx.inquiry.update({ where: { id: inquiryId }, data: { status } });
    await tx.inquiryStatusHistory.create({ data: { inquiryId, previousStatus, newStatus: status, changedByAdminId: BigInt(adminId), memo } });
    await tx.adminActivityLog.create({ data: { adminId: BigInt(adminId), actionType: 'INQUIRY_STATUS_CHANGED', targetType: 'INQUIRY', targetId: inquiryId } });
    return { status, changed: true };
  });
}

export async function changeInquiryAssignee(value: string, actorId: string, assignedAdminId: string | null) {
  const inquiryId = databaseId(value);
  const nextId = assignedAdminId ? BigInt(assignedAdminId) : null;
  return db().$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: bigint; assigned_admin_id: bigint | null }[]>`SELECT id, assigned_admin_id FROM inquiries WHERE id = ${inquiryId} AND deleted_at IS NULL FOR UPDATE`;
    if (!rows.length) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
    if (nextId) {
      const target = await tx.admin.findFirst({ where: { id: nextId, status: 'ACTIVE', deletedAt: null }, select: { id: true } });
      if (!target) throw new ApiError(422, 'VALIDATION_ERROR', '배정할 활성 관리자를 선택해주세요.');
    }
    const previous = rows[0].assigned_admin_id;
    if (previous === nextId) return { assignedAdminId: nextId?.toString() ?? null, changed: false };
    await tx.inquiry.update({ where: { id: inquiryId }, data: { assignedAdminId: nextId } });
    await tx.inquiryAssignmentHistory.create({ data: { inquiryId, previousAdminId: previous, newAdminId: nextId, changedByAdminId: BigInt(actorId) } });
    await tx.adminActivityLog.create({ data: { adminId: BigInt(actorId), actionType: 'INQUIRY_ASSIGNEE_CHANGED', targetType: 'INQUIRY', targetId: inquiryId } });
    return { assignedAdminId: nextId?.toString() ?? null, changed: true };
  });
}

export async function createInquiryNote(value: string, adminId: string, content: string) {
  const inquiryId = databaseId(value);
  await db().$transaction(async tx => {
    const rows = await tx.$queryRaw<{ id: bigint }[]>`SELECT id FROM inquiries WHERE id = ${inquiryId} AND deleted_at IS NULL FOR UPDATE`;
    if (!rows.length) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
    const note = await tx.inquiryNote.create({ data: { inquiryId, adminId: BigInt(adminId), content } });
    await tx.adminActivityLog.create({ data: { adminId: BigInt(adminId), actionType: 'INQUIRY_NOTE_CREATED', targetType: 'INQUIRY_NOTE', targetId: note.id } });
  });
}

async function editableNote(inquiryId: bigint, noteId: string, actorId: string, role: AdminRole) {
  const note = await db().inquiryNote.findFirst({ where: { id: databaseId(noteId), inquiryId, deletedAt: null, inquiry: { deletedAt: null } }, select: { id: true, adminId: true } });
  if (!note) throw new ApiError(404, 'NOT_FOUND', '메모를 찾을 수 없습니다.');
  if (note.adminId !== BigInt(actorId) && role !== 'SUPER_ADMIN') throw new ApiError(403, 'FORBIDDEN', '작성자 또는 최고 관리자만 메모를 변경할 수 있습니다.');
  return note;
}

export async function updateInquiryNote(value: string, noteId: string, actorId: string, role: AdminRole, content: string) {
  const inquiryId = databaseId(value);
  const note = await editableNote(inquiryId, noteId, actorId, role);
  await db().$transaction(async tx => {
    await tx.inquiryNote.update({ where: { id: note.id }, data: { content } });
    await tx.adminActivityLog.create({ data: { adminId: BigInt(actorId), actionType: 'INQUIRY_NOTE_UPDATED', targetType: 'INQUIRY_NOTE', targetId: note.id } });
  });
}

export async function deleteInquiryNote(value: string, noteId: string, actorId: string, role: AdminRole) {
  const inquiryId = databaseId(value);
  const note = await editableNote(inquiryId, noteId, actorId, role);
  await db().$transaction(async tx => {
    await tx.inquiryNote.update({ where: { id: note.id }, data: { deletedAt: new Date() } });
    await tx.adminActivityLog.create({ data: { adminId: BigInt(actorId), actionType: 'INQUIRY_NOTE_DELETED', targetType: 'INQUIRY_NOTE', targetId: note.id } });
  });
}

export async function inquiryTimeline(value: string) {
  const inquiryId = databaseId(value);
  const inquiry = await db().inquiry.findFirst({ where: { id: inquiryId, deletedAt: null }, select: { id: true } });
  if (!inquiry) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
  const [statuses, assignments, notes] = await Promise.all([
    db().inquiryStatusHistory.findMany({ where: { inquiryId }, include: { changedByAdmin: { select: { id: true, name: true } } } }),
    db().inquiryAssignmentHistory.findMany({ where: { inquiryId }, include: { previousAdmin: { select: { id: true, name: true } }, newAdmin: { select: { id: true, name: true } }, changedByAdmin: { select: { id: true, name: true } } } }),
    db().inquiryNote.findMany({ where: { inquiryId, deletedAt: null }, include: { admin: { select: { id: true, name: true } } } }),
  ]);
  const events = [
    ...statuses.map(item => ({ id: `status-${item.id}`, type: 'STATUS' as const, createdAt: item.createdAt.toISOString(), status: item.newStatus, memo: item.memo, actor: item.changedByAdmin ? { id: item.changedByAdmin.id.toString(), name: item.changedByAdmin.name } : null })),
    ...assignments.map(item => ({ id: `assignment-${item.id}`, type: 'ASSIGNMENT' as const, createdAt: item.createdAt.toISOString(), previousAdmin: item.previousAdmin?.name ?? null, newAdmin: item.newAdmin?.name ?? null, actor: { id: item.changedByAdmin.id.toString(), name: item.changedByAdmin.name } })),
    ...notes.map(item => ({ id: `note-${item.id}`, type: 'NOTE' as const, createdAt: item.createdAt.toISOString(), content: item.content, actor: { id: item.admin.id.toString(), name: item.admin.name } })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { events };
}
