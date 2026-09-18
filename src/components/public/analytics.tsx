'use client';
import Script from 'next/script'; import { useEffect } from 'react'; import { usePathname } from 'next/navigation';
declare global { interface Window { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[]; } }
const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export function trackEvent(name: 'phone_click'|'contact_start'|'contact_submit'|'service_view'|'work_view', params?: Record<string, string>) { if (id) window.gtag?.('event', name, params); }
export function GoogleAnalytics() { if (!id || !/^G-[A-Z0-9]+$/.test(id)) return null; return <><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}</Script></>; }
export function TrackView({ event, value }: { event: 'service_view'|'work_view'; value: string }) { useEffect(() => { trackEvent(event, { item: value }); }, [event, value]); return null; }
export function PageViewTracker() { const pathname=usePathname(); useEffect(()=>{ if (!pathname || pathname.startsWith('/admin')) return; void fetch('/api/analytics/page-view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:pathname}),keepalive:true}); },[pathname]); return null; }
