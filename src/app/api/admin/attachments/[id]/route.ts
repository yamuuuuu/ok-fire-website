import { ApiError, failure, requireSameOrigin, success } from '@/lib/http';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { databaseId } from '@/services/attachments';
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); const id = databaseId((await context.params).id); const attachment = await db().inquiryAttachment.findFirst({ where: { id, deletedAt: null, uploaderType: 'ADMIN', inquiry: { deletedAt: null } } }); if (!attachment) throw new ApiError(404, 'NOT_FOUND', '첨부 파일을 찾을 수 없습니다.'); await db().$transaction([db().inquiryAttachment.update({ where: { id }, data: { deletedAt: new Date() } }), db().adminActivityLog.create({ data: { adminId: BigInt(admin.id), actionType: 'ATTACHMENT_DELETED', targetType: 'INQUIRY_ATTACHMENT', targetId: id } })]); return success({ deleted: true }); } catch (error) { return failure(error); } }
