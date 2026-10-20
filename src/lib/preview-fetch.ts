import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import ipaddr from 'ipaddr.js';

export function isPublicAddress(address: string) {
  try {
    const ip = ipaddr.process(address);
    return ip.range() === 'unicast' &&
      (ip.kind() === 'ipv4' || (ip as ipaddr.IPv6).match(ipaddr.parse('2000::') as ipaddr.IPv6, 3));
  } catch { return false; }
}

export function previewUrl(value: string) {
  const url = new URL(value);
  if (value.length > 4096 || !['http:', 'https:'].includes(url.protocol) ||
    url.username || url.password || url.port) throw new Error('Unsupported preview address');
  return url;
}

async function resolvePublic(host: string, signal: AbortSignal) {
  let abort: () => void = () => {};
  try {
    const addresses = await Promise.race([
      lookup(host.replace(/^\[|\]$/g, ''), { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        abort = () => reject(new Error('Preview timeout'));
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      }),
    ]);
    if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
      throw new Error('Non-public preview address');
    }
    return addresses[0];
  } finally { signal.removeEventListener('abort', abort); }
}

/** Resolve and pin public IPs on every hop, including redirects. Never forward credentials. */
export async function fetchPreviewResource(value: string, kind: 'html' | 'image') {
  const signal = AbortSignal.timeout(6000);
  const maxBytes = kind === 'html' ? 1024 * 1024 : 4 * 1024 * 1024;
  let url = previewUrl(value);
  for (let hop = 0; hop < 4; hop++) {
    const address = await resolvePublic(url.hostname, signal);
    signal.throwIfAborted();
    const result = await new Promise<{ bytes?: Buffer; redirect?: string }>((resolve, reject) => {
      const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = request({
        protocol: url.protocol,
        hostname: address.address,
        family: address.family,
        servername: url.hostname,
        port: url.protocol === 'https:' ? 443 : 80,
        path: `${url.pathname}${url.search}`,
        signal,
        headers: {
          Host: url.host,
          'User-Agent': 'OKFire-LinkPreview/1.0',
          Accept: kind === 'html' ? 'text/html,application/xhtml+xml' : 'image/*',
          'Accept-Encoding': 'identity',
        },
      }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0) && res.headers.location) {
          resolve({ redirect: res.headers.location }); res.destroy(); return;
        }
        const type = res.headers['content-type'] ?? '';
        const validType = kind === 'html' ? /^(text\/html|application\/xhtml\+xml)\b/i.test(type) : /^image\//i.test(type);
        if (res.statusCode !== 200 || !validType || Number(res.headers['content-length']) > maxBytes) {
          reject(new Error('Unsupported preview response')); res.destroy(); return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) { reject(new Error('Preview too large')); res.destroy(); return; }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ bytes: Buffer.concat(chunks) }));
        res.on('error', reject);
        res.on('aborted', () => reject(new Error('Incomplete preview response')));
      });
      req.on('error', reject);
      req.end();
    });
    if (result.bytes) return { bytes: result.bytes, url: url.href };
    url = previewUrl(new URL(result.redirect!, url).href);
  }
  throw new Error('Too many preview redirects');
}
