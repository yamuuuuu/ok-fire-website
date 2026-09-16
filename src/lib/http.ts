import { NextResponse } from 'next/server';
import { getEnv } from './env';
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}
export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function failure(error: unknown) {
  const known = error instanceof ApiError;
  // Never log request bodies, secrets, database URLs or raw exception messages.
  if (!known) console.error('request_failed');
  return NextResponse.json({ success: false, error: {
    code: known ? error.code : 'INTERNAL_ERROR',
    message: known ? error.message : '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.',
    ...(known && error.fields ? { fields: error.fields } : {}),
  } }, { status: known ? error.status : 500, headers: { 'Cache-Control': 'no-store', ...(known && error.status === 429 ? { 'Retry-After': '900' } : {}) } });
}
export function requireSameOrigin(request: Request) {
  if (request.headers.get('origin') !== getEnv().APP_ORIGIN || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ApiError(403, 'FORBIDDEN', '허용되지 않은 요청입니다.');
  }
}
export async function readJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'INVALID_REQUEST', 'JSON 요청이 필요합니다.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'INVALID_REQUEST', '요청 본문이 없습니다.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, 'INVALID_REQUEST', '요청이 너무 큽니다.'); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new ApiError(400, 'INVALID_REQUEST', '잘못된 JSON입니다.'); }
  } finally { reader.releaseLock(); }
}
