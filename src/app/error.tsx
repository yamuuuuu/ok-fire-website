'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-2xl font-bold">화면을 불러오지 못했습니다.</h1><p className="my-5 text-slate-600">잠시 후 다시 시도해주세요.</p><button onClick={reset} className="min-h-12 rounded-xl bg-slate-900 px-6 text-white">다시 시도</button></main>;
}
