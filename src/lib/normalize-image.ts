import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { ApiError } from './http';
import { MAX_IMAGE_BYTES, type UploadInput } from '@/validations/upload';
const MAX_PIXELS = 50_000_000;
function invalid() { return new ApiError(415, 'UNSUPPORTED_FILE_TYPE', '사진을 읽을 수 없습니다. 정상적인 JPG, PNG, WebP, HEIC, HEIF 파일을 선택해주세요.'); }
export async function normalizeImage(bytes: Buffer, metadata: Pick<UploadInput, 'fileSize' | 'mimeType' | 'sha256'>) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ApiError(413, 'FILE_TOO_LARGE', '사진은 최대 10MB까지 올릴 수 있습니다.');
  if (bytes.length !== metadata.fileSize || createHash('sha256').update(bytes).digest('hex') !== metadata.sha256) throw new ApiError(422, 'FILE_CONTENT_MISMATCH', '선택한 사진과 업로드된 내용이 다릅니다. 다시 시도해주세요.');
  try {
    const detected = await fileTypeFromBuffer(bytes);
    const heif = ['image/heic', 'image/heif'].includes(metadata.mimeType);
    if (!detected || (heif ? !['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(detected.mime) : detected.mime !== metadata.mimeType)) throw invalid();
    let image: ReturnType<typeof sharp>;
    if (heif) {
      const { default: libheif } = await import('libheif-js');
      const decoded = new libheif.HeifDecoder().decode(bytes);
      try {
        if (!decoded.length) throw invalid();
        const first = decoded[0]; const width = first.get_width(); const height = first.get_height();
        if (width < 1 || height < 1 || width * height > MAX_PIXELS) throw new ApiError(413, 'IMAGE_DIMENSIONS_TOO_LARGE', '사진 해상도가 너무 큽니다. 5,000만 화소 이하 사진을 선택해주세요.');
        const raw = await new Promise<Uint8ClampedArray>((resolve, reject) => first.display({ width, height, data: new Uint8ClampedArray(width * height * 4) }, result => result ? resolve(result.data) : reject(invalid())));
        image = sharp(Buffer.from(raw), { raw: { width, height, channels: 4 } });
      } finally { for (const decodedImage of decoded) decodedImage.free(); }
    } else {
      image = sharp(bytes, { limitInputPixels: MAX_PIXELS, failOn: 'warning' }).autoOrient();
    }
    // Re-encoding strips EXIF/GPS, embedded payloads and extra frames. Original stays quarantined.
    const result = await image.resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).timeout({ seconds: 20 }).toBuffer({ resolveWithObject: true });
    return { bytes: result.data, width: result.info.width, height: result.info.height };
  } catch (error) { if (error instanceof ApiError) throw error; throw invalid(); }
}
