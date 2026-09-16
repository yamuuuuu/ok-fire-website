import type { Metadata } from 'next';
import './globals.css';
import { GoogleAnalytics } from '@/components/public/analytics';
import { siteUrl } from '@/lib/site-url';
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), title: { default: 'OK소방', template: '%s | OK소방' }, description: '30년 현장 경험. 소방전기 · 소방설비 시공 · 소방점검 전문 OK소방.', alternates: { canonical: '/' }, openGraph: { type: 'website', locale: 'ko_KR', siteName: 'OK소방', title: 'OK소방 | 30년 현장 경험', description: '소방전기 · 소방설비 시공 · 소방점검 전문 OK소방.' }, robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="antialiased">{children}<GoogleAnalytics/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'OK소방', description: '소방전기, 소방설비 시공, 소방시설 점검 전문', url: siteUrl(), areaServed: 'KR' }) }}/></body></html>;
}
