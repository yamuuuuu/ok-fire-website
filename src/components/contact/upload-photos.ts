import type { SelectedPhoto } from './photo-picker';
async function jsonResponse(response: Response) {
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? '사진 업로드에 실패했습니다.');
  return json.data;
}
export async function uploadPhotos(inquiryId: string, ownerKey: string, photos: SelectedPhoto[], completed: Set<string>, progress: (message: string) => void) {
  for (let index = 0; index < photos.length; index++) {
    const photo = photos[index]; if (completed.has(photo.clientId)) continue;
    progress(`사진 ${index + 1}/${photos.length}장 전송 중…`);
    const digest = await crypto.subtle.digest('SHA-256', await photo.file.arrayBuffer());
    const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const headers = { 'Content-Type': 'application/json', 'X-Inquiry-Key': ownerKey };
    const base = `/api/inquiries/${inquiryId}/attachments`;
    const reservation = await jsonResponse(await fetch(base, { method: 'POST', headers, body: JSON.stringify({ clientId: photo.clientId, originalName: photo.file.name, mimeType: photo.file.type, fileSize: photo.file.size, sha256 }) }));
    if (!reservation.complete) {
      const put = await fetch(reservation.url, { method: 'PUT', headers: reservation.headers, body: photo.file, credentials: 'omit', signal: AbortSignal.timeout(120000) });
      if (!put.ok) throw new Error('사진 전송에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
      progress(`사진 ${index + 1}/${photos.length}장 확인 중…`);
      await jsonResponse(await fetch(`${base}/${reservation.uploadId}/complete`, { method: 'POST', headers, signal: AbortSignal.timeout(65000) }));
    }
    completed.add(photo.clientId);
  }
}
