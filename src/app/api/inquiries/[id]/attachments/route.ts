import { ApiError, failure, readJson, requireSameOrigin, success } from '@/lib/http';
import { storageConfig } from '@/lib/storage/config';
import { requireUploadOwner, reserveUpload } from '@/services/attachments';
import { uploadSchema, MAX_IMAGE_BYTES } from '@/validations/upload';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const owner = await requireUploadOwner(request, (await context.params).id);
    if (!storageConfig()) throw new ApiError(503, 'STORAGE_UNAVAILABLE', '사진 업로드를 준비하고 있습니다.');
    const raw = await readJson(request);
    if (raw && typeof raw === 'object' && 'fileSize' in raw && typeof raw.fileSize === 'number' && raw.fileSize > MAX_IMAGE_BYTES) throw new ApiError(413, 'FILE_TOO_LARGE', '사진은 최대 10MB까지 올릴 수 있습니다.');
    const input = uploadSchema.safeParse(raw);
    if (!input.success) throw new ApiError(422, 'VALIDATION_ERROR', '사진의 형식, 크기, 파일 이름을 확인해주세요.');
    return success(await reserveUpload(owner.id, input.data), 201);
  } catch (error) { return failure(error); }
}
