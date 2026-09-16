import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { storageConfig } from '@/lib/storage/config';
import { requireAdmin } from '@/lib/session';
import { databaseId, reserveAdminUpload } from '@/services/attachments';
import { adminUploadSchema } from '@/validations/upload';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { requireSameOrigin(request); const admin = await requireAdmin(); if (!storageConfig()) throw new ApiError(503, 'STORAGE_UNAVAILABLE', '파일 업로드를 준비하고 있습니다.'); const parsed = adminUploadSchema.safeParse(await readJson(request)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', '파일 형식, 크기, 첨부 유형을 확인해주세요.'); return success(await reserveAdminUpload(databaseId((await context.params).id), admin.id, parsed.data), 201); } catch (error) { return failure(error); } }
