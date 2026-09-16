import 'server-only';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getEnv } from '@/lib/env';
import { ApiError } from '@/lib/http';
import { normalizeImage } from '@/lib/normalize-image';
import { deleteObject, readUpload, storeImage, storePrivateFile, uploadUrl, UPLOAD_URL_SECONDS } from '@/lib/storage/s3';
import { MAX_IMAGES, type UploadInput, type AdminUploadInput } from '@/validations/upload';
import { fileTypeFromBuffer } from 'file-type';

const OWNER_SECONDS = 30 * 60;
const TICKET_SECONDS = 10 * 60;
export function databaseId(value: string) {
  if (!/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > BigInt('9223372036854775807')) throw new ApiError(404, 'NOT_FOUND', '요청한 정보를 찾을 수 없습니다.');
  return BigInt(value);
}
export async function requireUploadOwner(request: Request, id: string) {
  const key = z.uuid().safeParse(request.headers.get('x-inquiry-key'));
  if (!key.success) throw new ApiError(401, 'UNAUTHORIZED', '접수한 화면에서 사진을 올려주세요.');
  const inquiry = await db().inquiry.findFirst({ where: {
    id: databaseId(id), submissionKeyHash: createHash('sha256').update(key.data).digest('hex'),
    deletedAt: null, createdAt: { gt: new Date(Date.now() - OWNER_SECONDS * 1000) },
  }, select: { id: true, createdAt: true } });
  if (!inquiry) throw new ApiError(403, 'FORBIDDEN', '사진을 올릴 수 있는 접수 정보가 없거나 업로드 시간이 지났습니다.');
  // Separate from inquiry creation limits. Raw capability/IP values are never persisted.
  const hash = createHmac('sha256', getEnv().AUTH_SECRET).update(`upload:${inquiry.id}`).digest('hex');
  const now = new Date(); const expiry = new Date(now.getTime() + OWNER_SECONDS * 1000);
  const [limit] = await db().$queryRaw<{ count: number }[]>`
    INSERT INTO public_rate_limits (key, count, expires_at) VALUES (${hash}, 1, ${expiry})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN public_rate_limits.expires_at <= ${now} THEN 1 ELSE LEAST(public_rate_limits.count + 1, 1000000) END,
      expires_at = CASE WHEN public_rate_limits.expires_at <= ${now} THEN ${expiry} ELSE public_rate_limits.expires_at END
    RETURNING count`;
  if (limit.count > 120) throw new ApiError(429, 'RATE_LIMITED', '사진 업로드 요청이 많습니다. 잠시 후 다시 시도해주세요.');
  return inquiry;
}
async function discard(key: string) {
  try { await deleteObject(key); } catch { console.error('storage_cleanup_required'); }
}
export async function reserveUpload(inquiryId: bigint, input: UploadInput) {
  const ticket = await db().$transaction(async tx => {
    await tx.$executeRaw`SELECT id FROM inquiries WHERE id = ${inquiryId} FOR UPDATE`;
    const existing = await tx.uploadTicket.findUnique({ where: { inquiryId_clientId: { inquiryId, clientId: input.clientId } } });
    if (existing) {
      if (existing.sha256 !== input.sha256 || existing.originalName !== input.originalName || existing.fileSize !== input.fileSize || existing.mimeType !== input.mimeType) throw new ApiError(409, 'UPLOAD_CONFLICT', '같은 사진 요청의 내용이 변경되었습니다.');
      if (existing.rejectedAt) throw new ApiError(415, 'UNSUPPORTED_FILE_TYPE', '검증에 실패한 사진입니다. 다른 파일을 선택해주세요.');
      if (existing.attachmentId) return existing;
      if (existing.expiresAt <= new Date()) throw new ApiError(410, 'UPLOAD_EXPIRED', '사진 업로드 시간이 지났습니다.');
      return existing;
    }
    const owner = await tx.inquiry.findFirst({ where: { id: inquiryId, deletedAt: null, createdAt: { gt: new Date(Date.now() - OWNER_SECONDS * 1000) } } });
    if (!owner) throw new ApiError(403, 'FORBIDDEN', '사진을 올릴 수 없는 접수입니다.');
    const count = await tx.inquiryAttachment.count({ where: { inquiryId, attachmentType: 'CUSTOMER', deletedAt: null } });
    const reserved = await tx.uploadTicket.count({ where: { inquiryId, attachmentId: null, rejectedAt: null, expiresAt: { gt: new Date() } } });
    if (count + reserved >= MAX_IMAGES) throw new ApiError(409, 'MAX_ATTACHMENT_EXCEEDED', '사진은 최대 10장까지 올릴 수 있습니다.');
    const id = randomUUID();
    return tx.uploadTicket.create({ data: { ...input, inquiryId, id, storageKey: `quarantine/${id}`, expiresAt: new Date(Math.min(Date.now() + TICKET_SECONDS * 1000, owner.createdAt.getTime() + OWNER_SECONDS * 1000)) } });
  });
  if (ticket.attachmentId) return { uploadId: ticket.id, attachmentId: ticket.attachmentId.toString(), complete: true as const };
  return { uploadId: ticket.id, complete: false as const, url: await uploadUrl(ticket.storageKey, ticket.mimeType, ticket.fileSize), headers: { 'Content-Type': ticket.mimeType }, expiresIn: UPLOAD_URL_SECONDS };
}
export async function reserveAdminUpload(inquiryId: bigint, adminId: string, input: AdminUploadInput) {
  const ticket = await db().$transaction(async tx => {
    const inquiry = await tx.inquiry.findFirst({ where: { id: inquiryId, deletedAt: null }, select: { id: true } });
    if (!inquiry) throw new ApiError(404, 'NOT_FOUND', '접수를 찾을 수 없습니다.');
    if (input.estimateId) {
      const estimate = await tx.estimate.findFirst({ where: { id: BigInt(input.estimateId), inquiryId, deletedAt: null }, select: { id: true } });
      if (!estimate) throw new ApiError(422, 'VALIDATION_ERROR', '이 접수의 견적을 선택해주세요.');
    }
    const id = randomUUID();
    return tx.uploadTicket.create({ data: { id, inquiryId, clientId: input.clientId, originalName: input.originalName, mimeType: input.mimeType, fileSize: input.fileSize, sha256: input.sha256, attachmentType: input.attachmentType, createdByAdminId: BigInt(adminId), estimateId: input.estimateId ? BigInt(input.estimateId) : null, storageKey: `quarantine/${id}`, expiresAt: new Date(Date.now() + TICKET_SECONDS * 1000) } });
  });
  return { uploadId: ticket.id, complete: false as const, url: await uploadUrl(ticket.storageKey, ticket.mimeType, ticket.fileSize), headers: { 'Content-Type': ticket.mimeType }, expiresIn: UPLOAD_URL_SECONDS };
}
export async function reserveWorkImage(workCaseId: bigint, adminId: string, input: UploadInput) {
  const ticket = await db().$transaction(async tx => {
    if (!await tx.workCase.findFirst({ where: { id: workCaseId, deletedAt: null }, select: { id: true } })) throw new ApiError(404, 'NOT_FOUND', '작업사례를 찾을 수 없습니다.');
    const id = randomUUID(); return tx.uploadTicket.create({ data: { id, workCaseId, clientId: input.clientId, originalName: input.originalName, mimeType: input.mimeType, fileSize: input.fileSize, sha256: input.sha256, attachmentType: 'ETC', createdByAdminId: BigInt(adminId), storageKey: `quarantine/${id}`, expiresAt: new Date(Date.now() + TICKET_SECONDS * 1000) } });
  });
  return { uploadId: ticket.id, url: await uploadUrl(ticket.storageKey, ticket.mimeType, ticket.fileSize), headers: { 'Content-Type': ticket.mimeType }, expiresIn: UPLOAD_URL_SECONDS };
}
export async function completeWorkImage(workCaseId: bigint, uploadId: string, imageType: 'BEFORE'|'WORKING'|'AFTER', altText?: string) {
  if (!z.uuid().safeParse(uploadId).success) throw new ApiError(404, 'NOT_FOUND', '사진 요청을 찾을 수 없습니다.'); const ticket = await db().uploadTicket.findFirst({ where: { id: uploadId, workCaseId } });
  if (!ticket || ticket.expiresAt <= new Date()) throw new ApiError(410, 'UPLOAD_EXPIRED', '사진 업로드 시간이 지났습니다.'); const bytes = await readUpload(ticket.storageKey); let clean: Awaited<ReturnType<typeof normalizeImage>>;
  try { clean = await normalizeImage(bytes, ticket); } catch (error) { await db().uploadTicket.update({ where: { id: ticket.id }, data: { rejectedAt: new Date() } }); await discard(ticket.storageKey); throw error; }
  const finalKey = `private/works/${ticket.id}/${randomUUID()}.jpg`; await storeImage(finalKey, clean.bytes);
  const image = await db().$transaction(async tx => { const current = await tx.uploadTicket.findFirst({ where: { id: ticket.id, workCaseId } }); if (!current || current.expiresAt <= new Date()) throw new ApiError(410,'UPLOAD_EXPIRED','사진 업로드 시간이 지났습니다.'); const count = await tx.workCaseImage.count({ where: { workCaseId, imageType, deletedAt: null } }); const result = await tx.workCaseImage.create({ data: { workCaseId, imageType, storageKey: finalKey, altText, sortOrder: count } }); await tx.uploadTicket.delete({ where: { id: ticket.id } }); return result; }); await discard(ticket.storageKey); return { id: image.id.toString() };
}
export async function completeUpload(inquiryId: bigint, uploadId: string) {
  if (!z.uuid().safeParse(uploadId).success) throw new ApiError(404, 'NOT_FOUND', '사진 요청을 찾을 수 없습니다.');
  const ticket = await db().uploadTicket.findFirst({ where: { id: uploadId, inquiryId }, include: { attachment: true } });
  if (!ticket || ticket.rejectedAt) throw new ApiError(404, 'NOT_FOUND', '사진 요청을 찾을 수 없습니다.');
  if (ticket.attachment && !ticket.attachment.deletedAt) return { id: ticket.attachment.id.toString(), complete: true };
  if (ticket.attachmentId || ticket.expiresAt <= new Date()) throw new ApiError(410, 'UPLOAD_EXPIRED', '사진 업로드 시간이 지났습니다.');
  let bytes: Buffer;
  try { bytes = await readUpload(ticket.storageKey); }
  catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'FILE_UPLOAD_FAILED', '사진 전송을 확인하지 못했습니다. 다시 시도해주세요.');
  }
  const isAdmin = ticket.createdByAdminId !== null;
  let clean: Awaited<ReturnType<typeof normalizeImage>> | undefined; let finalBytes: Buffer | undefined; let finalMime: string | undefined; let image = false;
  try { clean = await normalizeImage(bytes, ticket); }
  catch (error) {
    if (!isAdmin || ticket.attachmentType !== 'ESTIMATE') {
      await db().uploadTicket.updateMany({ where: { id: ticket.id, attachmentId: null }, data: { rejectedAt: new Date() } }); await discard(ticket.storageKey); throw error;
    }
    const type = await fileTypeFromBuffer(bytes); const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!type || type.mime !== ticket.mimeType || !allowed.includes(type.mime) || createHash('sha256').update(bytes).digest('hex') !== ticket.sha256 || bytes.length !== ticket.fileSize) {
      await db().uploadTicket.updateMany({ where: { id: ticket.id, attachmentId: null }, data: { rejectedAt: new Date() } }); await discard(ticket.storageKey); throw new ApiError(415, 'UNSUPPORTED_FILE_TYPE', '견적 파일을 읽을 수 없습니다. PDF 또는 XLSX 파일을 선택해주세요.');
    }
    finalBytes = bytes; finalMime = type.mime;
  }
  if (clean) { finalBytes = clean.bytes; finalMime = 'image/jpeg'; image = true; }
  if (!finalBytes || !finalMime) throw new ApiError(400, 'FILE_UPLOAD_FAILED', '파일 전송을 확인하지 못했습니다. 다시 시도해주세요.');
  // Every attempt has a distinct final key: a still-valid PUT URL can only change quarantine.
  const finalKey = `private/${ticket.id}/${randomUUID()}.${image ? 'jpg' : ticket.originalName.split('.').pop()!.toLowerCase()}`;
  if (image) await storeImage(finalKey, finalBytes); else await storePrivateFile(finalKey, finalBytes, finalMime, ticket.originalName);
  // If this transaction fails ambiguously, retain the object for reconciliation; never risk deleting a committed photo.
  const attachment = await db().$transaction(async tx => {
    await tx.$executeRaw`SELECT id FROM inquiries WHERE id = ${inquiryId} FOR UPDATE`;
    const current = await tx.uploadTicket.findUniqueOrThrow({ where: { id: ticket.id }, include: { attachment: true } });
    if (current.attachment && !current.attachment.deletedAt) return current.attachment;
    const owner = await tx.inquiry.findFirst({ where: { id: inquiryId, deletedAt: null, ...(current.createdByAdminId ? {} : { createdAt: { gt: new Date(Date.now() - OWNER_SECONDS * 1000) } }) } });
    if (!owner || current.rejectedAt || current.attachmentId || current.expiresAt <= new Date()) throw new ApiError(410, 'UPLOAD_EXPIRED', '파일 업로드 시간이 지났습니다.');
    const count = await tx.inquiryAttachment.count({ where: { inquiryId, attachmentType: current.attachmentType, deletedAt: null } });
    if (current.attachmentType === 'CUSTOMER' && count >= MAX_IMAGES) throw new ApiError(409, 'MAX_ATTACHMENT_EXCEEDED', '사진은 최대 10장까지 올릴 수 있습니다.');
    const result = await tx.inquiryAttachment.create({ data: {
      inquiryId, uploaderType: current.createdByAdminId ? 'ADMIN' : 'CUSTOMER', uploadedByAdminId: current.createdByAdminId, attachmentType: current.attachmentType, estimateId: current.estimateId, originalName: ticket.originalName,
      storedName: finalKey.split('/').pop()!, storageKey: finalKey, mimeType: finalMime, fileSize: finalBytes.length, sortOrder: count,
    } });
    await tx.uploadTicket.update({ where: { id: ticket.id }, data: { attachmentId: result.id } });
    return result;
  });
  if (attachment.storageKey !== finalKey) await discard(finalKey);
  await discard(ticket.storageKey);
  return { id: attachment.id.toString(), complete: true };
}
