import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import FullDetailRenderer from '@/components/ads/FullDetailRenderer';

type NextPageProps = {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: NextPageProps): Promise<Metadata> {
  const p = (await props.params) || {};
  const rawId = p.id;
  const id = Array.isArray(rawId) ? (rawId[0] || '') : (rawId || '');
  if (!id) return {};
  const ad = await prisma.ad.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, price: true, currency: true, photos: true, address: true, isActive: true, moderationStatus: true } as any
  } as any);
  if (!ad) return {};
  const slug = slugify(ad.title || '');
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const canonical = `${base}/ad/${ad.id}/${slug}`;
  const ogImage = Array.isArray((ad as any).photos) && (ad as any).photos[0]
    ? String((ad as any).photos[0])
    : `${base}/opengraph-image`;
  const title = `${ad.title || 'Ad'}${ad.price ? ` • ${ad.price} ${ad.currency || ''}` : ''}`.trim();
  const description = ad.description || undefined;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ad.title || 'Listing' }],
      siteName: 'SellOnMap',
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    robots: { index: Boolean((ad as any).isActive && (ad as any).moderationStatus === 'APPROVED'), follow: Boolean((ad as any).isActive && (ad as any).moderationStatus === 'APPROVED') },
  };
}

export default async function AdDetailPage(props: NextPageProps) {
  const p = (await props.params) || {};
  const rawId = p.id;
  const rawSlug = p.slug;
  const id = Array.isArray(rawId) ? (rawId[0] || '') : (rawId || '');
  const slug = Array.isArray(rawSlug) ? (rawSlug[0] || '') : (rawSlug || '');
  if (!id) return notFound();
  const ad = await prisma.ad.findUnique({ where: { id } } as any);
  if (!ad) return notFound();
  // Only allow public view if approved and active
  if (!(ad as any).isActive || (ad as any).moderationStatus !== 'APPROVED') {
    const session = (await getServerSession(authOptions as any)) as any;
    const isAdmin = Boolean(session?.user?.isAdmin);
    const userId = session?.user?.id as string | undefined;
    if (!isAdmin && (ad as any).userId !== userId) return notFound();
  }

  const expectedSlug = slugify(ad.title || '');
  if (expectedSlug && slug !== expectedSlug) {
    permanentRedirect(`/ad/${id}/${expectedSlug}`);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClassifiedAd',
    name: (ad as any).title,
    description: (ad as any).description,
    url: `${(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/ad/${(ad as any).id}/${expectedSlug}`,
    image: Array.isArray((ad as any).photos) ? (ad as any).photos : undefined,
    price: (ad as any).price,
    priceCurrency: (ad as any).currency || 'USD',
    address: (ad as any).address,
  } as const;

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-4xl mx-auto py-16 px-4">
        <div className="bg-white">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <FullDetailRenderer ad={{ ...(ad as any), details: (ad as any).attributes || undefined }} />
        </div>
      </main>
    </div>
  );
}


