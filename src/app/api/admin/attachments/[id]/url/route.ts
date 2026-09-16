import { ApiError, failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { db } from '@/lib/db';
import { privateAttachmentUrl, privateImageUrl, READ_URL_SECONDS } from '@/lib/storage/s3';
import { databaseId } from '@/services/attachments';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const attachment = await db().inquiryAttachment.findFirst({ where: { id: databaseId((await context.params).id), deletedAt: null, inquiry: { deletedAt: null } } });
    if (!attachment) throw new ApiError(404, 'NOT_FOUND', '사진을 찾을 수 없습니다.');
    if (!attachment.storageKey.startsWith('private/')) throw new ApiError(415, 'UNSUPPORTED_FILE_TYPE', '지원하지 않는 파일입니다.');
    const url = attachment.mimeType === 'image/jpeg' ? await privateImageUrl(attachment.storageKey) : await privateAttachmentUrl(attachment.storageKey, attachment.mimeType, attachment.originalName);
    await db().adminActivityLog.create({ data: { adminId: BigInt(admin.id), actionType: 'ATTACHMENT_VIEW', targetType: 'INQUIRY_ATTACHMENT', targetId: attachment.id } });
    return success({ url, expiresIn: READ_URL_SECONDS });
  } catch (error) { return failure(error); }
}
