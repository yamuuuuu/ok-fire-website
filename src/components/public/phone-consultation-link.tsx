'use client';

import { PUBLIC_PHONE_HREF, PUBLIC_PHONE_NUMBER } from '@/lib/public-contact';
import { trackEvent } from './analytics';

export function PhoneConsultationLink({ variant }: { variant: 'hero' | 'mobile' }) {
  const hero = variant === 'hero';
  return <a
    href={PUBLIC_PHONE_HREF}
    onClick={() => trackEvent('phone_click')}
    className={hero
      ? 'inline-flex min-h-14 flex-col items-center justify-center rounded-xl border border-white/30 px-6 font-bold text-white hover:bg-white/10'
      : 'flex min-h-14 flex-col items-center justify-center bg-white text-sm font-bold text-slate-900'}
  >
    <span>{hero ? '전화 상담하기' : '전화 상담'}</span>
    <span className={hero ? 'text-sm font-medium text-slate-300' : 'text-xs font-medium text-slate-600'}>{PUBLIC_PHONE_NUMBER}</span>
  </a>;
}
