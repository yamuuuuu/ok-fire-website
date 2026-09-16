'use client';
/* eslint-disable @next/next/no-img-element -- Local File object URLs cannot use the Next.js image optimizer. */
import { useEffect, useRef, useState } from 'react';
import { IMAGE_ACCEPT, imageMetadataError, MAX_IMAGES } from '@/validations/upload';
export type SelectedPhoto = { clientId: string; file: File };
function Preview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    if (image.current) image.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-slate-100">
    {!failed ? <img ref={image} alt={`${file.name} 미리보기`} onError={() => setFailed(true)} className="h-full w-full object-cover"/> : <span className="p-3 text-center text-xs leading-5 text-slate-500">사진 선택됨<br/>미리보기를 지원하지 않는 형식입니다.</span>}
  </div>;
}
export function PhotoPicker({ photos, onChange, readOnly = false }: { photos: SelectedPhoto[]; onChange: (photos: SelectedPhoto[]) => void; readOnly?: boolean }) {
  const [error, setError] = useState('');
  function add(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    if (photos.length + selected.length > MAX_IMAGES) { setError('사진은 최대 10장까지 선택해주세요.'); return; }
    for (const file of selected) {
      const message = imageMetadataError(file.name, file.size, file.type);
      if (message) { setError(`${file.name}: ${message}`); return; }
    }
    setError(''); onChange([...photos, ...selected.map(file => ({ clientId: crypto.randomUUID(), file }))]);
  }
  return <div>
    <p className="mb-3 text-sm font-semibold">현장 사진 <span className="ml-2 font-normal text-slate-400">선택 · {photos.length}/10장</span></p>
    {!readOnly && <><label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-400 p-3 font-semibold has-focus-visible:ring-2 has-focus-visible:ring-red-700">사진 선택<input aria-label="현장 사진 선택" type="file" accept={IMAGE_ACCEPT} multiple className="sr-only" onChange={event => { add(event.target.files); event.target.value = ''; }}/></label><p className="mt-2 text-xs leading-6 text-slate-500">JPG·PNG·WebP·HEIC·HEIF, 한 장당 최대 10MB. 동의 후 접수할 때 사진이 전송됩니다.</p></>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(photo => <li key={photo.clientId} className="min-w-0 rounded-xl border border-slate-200 p-2"><Preview file={photo.file}/><p className="mt-2 truncate text-xs" title={photo.file.name}>{photo.file.name}</p>{!readOnly && <button type="button" onClick={() => { onChange(photos.filter(item => item.clientId !== photo.clientId)); setError(''); }} className="mt-1 min-h-11 w-full rounded-lg text-sm font-semibold text-red-700" aria-label={`${photo.file.name} 삭제`}>삭제</button>}</li>)}</ul>
  </div>;
}
