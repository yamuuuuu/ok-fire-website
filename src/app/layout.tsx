import type { Metadata } from 'next';
import './globals.css';
import { GoogleAnalytics } from '@/components/public/analytics';
import { JsonLd } from '@/components/public/json-ld';
import { absoluteUrl, siteUrl } from '@/lib/site-url';
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), title: { default: 'OK소방', template: '%s | OK소방' }, description: '30년 현장 경험. 소방전기 · 소방설비 시공 · 소방점검 전문 OK소방.', alternates: { canonical: '/' }, icons: { icon: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }], shortcut: '/favicon.ico', apple: '/apple-icon.png' }, openGraph: { type: 'website', locale: 'ko_KR', siteName: 'OK소방', title: 'OK소방 | 30년 현장 경험', description: '소방전기 · 소방설비 시공 · 소방점검 전문 OK소방.', images: [{ url: '/okfire-logo.png', width: 1000, height: 361, alt: 'OK소방 로고' }] }, robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const business = { '@context': 'https://schema.org', '@type': ['LocalBusiness', 'Organization'], '@id': `${siteUrl()}/#business`, name: 'OK소방', description: '30년 현장 경험을 바탕으로 소방전기, 소방설비 시공, 스프링클러 설치, 화재경보기와 소방시설 점검을 상담합니다.', url: siteUrl(), logo: absoluteUrl('/okfire-logo.png'), image: absoluteUrl('/okfire-logo.png'), address: { '@type': 'PostalAddress', streetAddress: '사가정로42길 23', addressLocality: '중랑구', addressRegion: '서울특별시', addressCountry: 'KR' }, areaServed: { '@type': 'City', name: '서울특별시' }, openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '09:00', closes: '18:00' }] };
  return <html lang="ko"><body className="antialiased">{children}<GoogleAnalytics/><JsonLd data={business}/></body></html>;
}
