import { ApiError, failure, success } from '@/lib/http';
import { requireAdmin } from '@/lib/session';
import { databaseId } from '@/services/attachments';
import { db } from '@/lib/db';
import { privateImageUrl, READ_URL_SECONDS } from '@/lib/storage/s3';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { const admin = await requireAdmin(); const image = await db().workCaseImage.findFirst({ where: { id: databaseId((await context.params).id), deletedAt: null, workCase: { deletedAt: null } } }); if (!image) throw new ApiError(404, 'NOT_FOUND', '작업 사진을 찾을 수 없습니다.'); const url = await privateImageUrl(image.storageKey); await db().adminActivityLog.create({ data: { adminId: BigInt(admin.id), actionType: 'WORK_IMAGE_VIEW', targetType: 'WORK_IMAGE', targetId: image.id } }); return success({ url, expiresIn: READ_URL_SECONDS }); } catch (error) { return failure(error); } }
