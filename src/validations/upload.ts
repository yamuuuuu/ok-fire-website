import { z } from 'zod';
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES = 10;
export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif';
const mimeByExtension: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' };
export function imageMetadataError(name: string, size: number, mime: string): string | null {
  const expected = mimeByExtension[name.split('.').pop()?.toLowerCase() ?? ''];
  if (!expected || (mime && mime !== expected && !([expected, mime].every(v => ['image/heic', 'image/heif'].includes(v))))) return 'JPG, PNG, WebP, HEIC, HEIF 사진만 선택해주세요.';
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_IMAGE_BYTES) return '사진 한 장은 0바이트 초과, 최대 10MB까지 올릴 수 있습니다.';
  if (!name.trim() || name.length > 255 || /[\x00-\x1f\x7f/\\]/.test(name)) return '사진 파일 이름을 확인해주세요.';
  return null;
}
export const uploadSchema = z.object({
  clientId: z.uuid(), originalName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_IMAGE_BYTES), mimeType: z.string().max(100),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict().superRefine((value, context) => {
  const error = imageMetadataError(value.originalName, value.fileSize, value.mimeType);
  if (error) context.addIssue({ code: 'custom', path: ['originalName'], message: error });
}).transform(value => ({ ...value, mimeType: mimeByExtension[value.originalName.split('.').pop()!.toLowerCase()] }));
export type UploadInput = z.output<typeof uploadSchema>;

export const ADMIN_ATTACHMENT_TYPES = ['BEFORE', 'WORKING', 'AFTER', 'ESTIMATE', 'ETC'] as const;
const adminMimeByExtension: Record<string, string> = { ...mimeByExtension, pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
export const adminUploadSchema = z.object({
  clientId: z.uuid(), originalName: z.string().trim().min(1).max(255), fileSize: z.number().int().positive().max(MAX_IMAGE_BYTES),
  mimeType: z.string().max(100), sha256: z.string().regex(/^[a-f0-9]{64}$/), attachmentType: z.enum(ADMIN_ATTACHMENT_TYPES), estimateId: z.string().regex(/^[1-9]\d{0,18}$/).optional(),
}).strict().superRefine((value, context) => {
  const extension = value.originalName.split('.').pop()?.toLowerCase() ?? ''; const expected = adminMimeByExtension[extension];
  if (!expected || value.mimeType !== expected) context.addIssue({ code: 'custom', path: ['originalName'], message: '파일 형식과 확장자를 확인해주세요.' });
  if (value.attachmentType !== 'ESTIMATE' && !mimeByExtension[extension]) context.addIssue({ code: 'custom', path: ['attachmentType'], message: '현장 사진은 이미지 파일만 올릴 수 있습니다.' });
  if (value.attachmentType === 'ESTIMATE' && !['pdf', 'jpg', 'jpeg', 'png', 'xlsx'].includes(extension)) context.addIssue({ code: 'custom', path: ['attachmentType'], message: '견적 파일은 PDF, JPG, PNG, XLSX만 올릴 수 있습니다.' });
}).transform(value => ({ ...value, mimeType: adminMimeByExtension[value.originalName.split('.').pop()!.toLowerCase()] }));
export type AdminUploadInput = z.output<typeof adminUploadSchema>;
