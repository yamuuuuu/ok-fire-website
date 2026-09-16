import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'node:stream';
import { storageConfig } from './config';
import { ApiError } from '../http';
import { MAX_IMAGE_BYTES } from '@/validations/upload';
export const UPLOAD_URL_SECONDS = 300;
export const READ_URL_SECONDS = 60;
export function storage() {
  const config = storageConfig();
  if (!config) throw new ApiError(503, 'STORAGE_UNAVAILABLE', '사진 업로드를 준비하고 있습니다.');
  const client = new S3Client({
    endpoint: config.STORAGE_ENDPOINT, region: config.STORAGE_REGION, forcePathStyle: true,
    credentials: { accessKeyId: config.STORAGE_ACCESS_KEY_ID, secretAccessKey: config.STORAGE_SECRET_ACCESS_KEY },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', maxAttempts: 2,
  });
  return { client, bucket: config.STORAGE_BUCKET };
}
export async function uploadUrl(key: string, mime: string, size: number) {
  const { client, bucket } = storage();
  try {
    return await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mime, ContentLength: size }), {
      expiresIn: UPLOAD_URL_SECONDS, signableHeaders: new Set(['content-type', 'content-length']),
    });
  } finally { client.destroy(); }
}
export async function readUpload(key: string): Promise<Buffer> {
  const { client, bucket } = storage(); let body: Readable | undefined;
  try {
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(20000) });
    body = object.Body as Readable;
    if (!body) throw new ApiError(400, 'FILE_UPLOAD_FAILED', '사진이 아직 업로드되지 않았습니다.');
    if ((object.ContentLength ?? 0) > MAX_IMAGE_BYTES) throw new ApiError(413, 'FILE_TOO_LARGE', '사진은 최대 10MB까지 올릴 수 있습니다.');
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of body) {
      const buffer = Buffer.from(chunk); size += buffer.length;
      if (size > MAX_IMAGE_BYTES) throw new ApiError(413, 'FILE_TOO_LARGE', '사진은 최대 10MB까지 올릴 수 있습니다.');
      chunks.push(buffer);
    }
    return Buffer.concat(chunks);
  } finally { body?.destroy(); client.destroy(); }
}
export async function storeImage(key: string, data: Buffer) {
  const { client, bucket } = storage();
  try { await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: 'image/jpeg', ContentDisposition: 'inline; filename="photo.jpg"', CacheControl: 'private, no-store' }), { abortSignal: AbortSignal.timeout(20000) }); }
  finally { client.destroy(); }
}
export async function storePrivateFile(key: string, data: Buffer, mime: string, filename: string) {
  const { client, bucket } = storage();
  try { await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mime, ContentDisposition: `attachment; filename="${filename.replace(/[\"\\]/g, '_')}"`, CacheControl: 'private, no-store' }), { abortSignal: AbortSignal.timeout(20000) }); }
  finally { client.destroy(); }
}
export async function deleteObject(key: string) {
  const { client, bucket } = storage();
  try { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: AbortSignal.timeout(10000) }); }
  finally { client.destroy(); }
}
export async function privateImageUrl(key: string) {
  const { client, bucket } = storage();
  try { return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: 'image/jpeg', ResponseContentDisposition: 'inline; filename="photo.jpg"', ResponseCacheControl: 'private, no-store' }), { expiresIn: READ_URL_SECONDS }); }
  finally { client.destroy(); }
}
export async function privateAttachmentUrl(key: string, mime: string, filename: string) {
  const { client, bucket } = storage();
  try { return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: mime, ResponseContentDisposition: `attachment; filename="${filename.replace(/[\"\\]/g, '_')}"`, ResponseCacheControl: 'private, no-store' }), { expiresIn: READ_URL_SECONDS }); }
  finally { client.destroy(); }
}
export async function listPrivateObjects(prefix: string, continuationToken?: string) {
  const { client, bucket } = storage();
  try { return await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken, MaxKeys: 1000 })); }
  finally { client.destroy(); }
}
