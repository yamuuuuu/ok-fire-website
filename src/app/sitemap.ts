import type { MetadataRoute } from 'next';
import { services } from '@/components/public/service-cards';
import { db } from '@/lib/db';
import { absoluteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = ['/', '/about', '/services', ...services.map(service => `/services/${service.slug}`), '/works', '/faq', '/contact', '/privacy'].map(url => ({ url: absoluteUrl(url), lastModified: new Date(), changeFrequency: url === '/' ? 'weekly' as const : 'monthly' as const, priority: url === '/' ? 1 : 0.7 }));
  try {
    const works = await db().workCase.findMany({ where: { published: true, deletedAt: null }, select: { slug: true, updatedAt: true } });
    return [...base, ...works.map(work => ({ url: absoluteUrl(`/works/${work.slug}`), lastModified: work.updatedAt, changeFrequency: 'monthly' as const, priority: 0.6 }))];
  } catch { return base; }
}
