'use client';
import { useEffect, useState } from 'react';

export function ProtectedImage({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/attachments/${id}/url`, { signal: controller.signal, credentials: 'same-origin' })
      .then(async response => {
        if (!response.ok) throw new Error('image_url_failed');
        const body = await response.json() as { data?: { url?: string } };
        if (!body.data?.url) throw new Error('image_url_missing');
        setUrl(body.data.url);
      })
      .catch(error => { if (error instanceof Error && error.name !== 'AbortError') setFailed(true); });
    return () => controller.abort();
  }, [id]);
  if (failed) return <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 p-3 text-center text-xs text-slate-500">사진을 불러오지 못했습니다.</div>;
  if (!url) return <div className="aspect-square animate-pulse rounded-xl bg-slate-100" aria-label={`${name} 불러오는 중`}/>;
  return <a href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl bg-slate-100">
    {/* A temporary, authenticated object-storage URL cannot be configured as a static Next Image host. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={name} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"/>
  </a>;
}
