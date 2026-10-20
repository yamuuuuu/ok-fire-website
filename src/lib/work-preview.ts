import { load } from 'cheerio';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { fetchPreviewResource, previewUrl } from './preview-fetch';
import { textLinks } from './text-links';

export type WorkPreview = { href: string; title: string; hostname: string; image: string | null };

export function firstWorkLink(description: string, summary: string | null) {
  return textLinks(`${description}\n${summary ?? ''}`).find(part => part.href)?.href;
}

export function metadataAddress(value: string) {
  const url = previewUrl(value);
  // Naver's desktop permalink is an iframe wrapper. Fetch only this known public post endpoint.
  const post = url.pathname.match(/^\/([a-zA-Z0-9_-]+)\/(\d+)\/?$/);
  if (['blog.naver.com', 'm.blog.naver.com'].includes(url.hostname) && post) {
    return `https://blog.naver.com/PostView.naver?blogId=${post[1]}&logNo=${post[2]}`;
  }
  return url.href;
}

export function parsePreviewMetadata(html: string, base: string) {
  const $ = load(html);
  const meta = (key: string) => $(`meta[property="${key}"],meta[name="${key}"]`).first().attr('content')?.trim();
  const title = (meta('og:title') || meta('twitter:title') || $('title').first().text()).trim().slice(0, 300);
  const rawImage = meta('og:image:secure_url') || meta('og:image') || meta('twitter:image');
  let image: string | null = null;
  try { if (rawImage) image = previewUrl(new URL(rawImage, base).href).href; } catch {}
  return { title, image };
}

export async function loadWorkPreview(href: string): Promise<WorkPreview> {
  const fallback: WorkPreview = { href, title: '', hostname: new URL(href).hostname, image: null };
  try {
    const page = await fetchPreviewResource(metadataAddress(href), 'html');
    const metadata = parsePreviewMetadata(page.bytes.toString('utf8'), page.url);
    fallback.title = metadata.title;
    if (metadata.image) {
      try {
        const source = await fetchPreviewResource(metadata.image, 'image');
        const type = await fileTypeFromBuffer(source.bytes);
        if (type && ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(type.mime)) {
          const image = await sharp(source.bytes, { limitInputPixels: 16_000_000, animated: false })
            .rotate().resize(800, 450, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
          fallback.image = `data:image/webp;base64,${image.toString('base64')}`;
        }
      } catch { /* Keep the source link usable if its image is unavailable. */ }
    }
  } catch { /* Unavailable metadata must not prevent the work list from loading. */ }
  return fallback;
}
