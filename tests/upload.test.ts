import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { normalizeImage } from '../src/lib/normalize-image';
import { imageMetadataError, MAX_IMAGE_BYTES, uploadSchema } from '../src/validations/upload';
import { storageConfig } from '../src/lib/storage/config';
const metadata = (bytes: Buffer, mimeType: string) => ({ fileSize: bytes.length, mimeType, sha256: createHash('sha256').update(bytes).digest('hex') });
test('validates extensions, MIME, size and unsafe names', () => {
  assert.equal(imageMetadataError('photo.HEIC', 123, ''), null);
  for (const [name, size, mime] of [['photo.svg', 100, 'image/svg+xml'], ['photo.jpg', 100, 'image/png'], ['../photo.jpg', 100, 'image/jpeg'], ['empty.jpg', 0, 'image/jpeg'], ['huge.jpg', MAX_IMAGE_BYTES + 1, 'image/jpeg']] as const) assert.ok(imageMetadataError(name, size, mime));
  assert.equal(uploadSchema.safeParse({ clientId: 'invalid' }).success, false);
});
test('decodes actual PNG/JPEG/WebP and removes metadata while resizing', async () => {
  for (const format of ['png', 'jpeg', 'webp'] as const) {
    const input = await sharp({ create: { width: 3000, height: 20, channels: 3, background: '#bb0000' } }).withMetadata({ orientation: 1 }).toFormat(format).toBuffer();
    const normalized = await normalizeImage(input, metadata(input, `image/${format}`));
    const result = await sharp(normalized.bytes).metadata();
    assert.equal(result.format, 'jpeg'); assert.equal(result.width, 2560); assert.equal(result.exif, undefined); assert.equal(result.icc, undefined);
  }
});
test('rejects forged images, wrong hashes and corrupt image data', async () => {
  const html = Buffer.from('<svg><script>alert(1)</script></svg>');
  await assert.rejects(normalizeImage(html, metadata(html, 'image/jpeg')));
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer();
  await assert.rejects(normalizeImage(png, metadata(png, 'image/jpeg')));
  await assert.rejects(normalizeImage(png, { ...metadata(png, 'image/png'), sha256: '0'.repeat(64) }));
  const corrupt = png.subarray(0, 40);
  await assert.rejects(normalizeImage(corrupt, metadata(corrupt, 'image/png')));
});
test('HEIC/HEIF decoder produces a valid normalized JPEG', async () => {
  const input = await readFile('tests/fixtures/example.heic');
  for (const mime of ['image/heic', 'image/heif']) {
    const result = await normalizeImage(input, metadata(input, mime));
    const decoded = await sharp(result.bytes).metadata();
    assert.equal(decoded.format, 'jpeg'); assert.ok(decoded.width! > 0); assert.equal(decoded.exif, undefined);
  }
});
test('storage configuration fails closed and does not allow remote HTTP endpoints', () => {
  const previous = { ...process.env };
  try {
    process.env.STORAGE_ENDPOINT = ''; assert.equal(storageConfig(), null);
    Object.assign(process.env, { STORAGE_ENDPOINT: 'http://remote.example', STORAGE_REGION: 'test', STORAGE_BUCKET: 'test', STORAGE_ACCESS_KEY_ID: 'test', STORAGE_SECRET_ACCESS_KEY: 'test' });
    assert.equal(storageConfig(), null);
    process.env.STORAGE_ENDPOINT = 'https://storage.example'; assert.ok(storageConfig());
  } finally { process.env = previous; }
});
