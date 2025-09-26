import { permanentRedirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

type NextPageProps = {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdIdRedirect(props: NextPageProps) {
  const p = (await props.params) || {};
  const rawId = p.id;
  const id = Array.isArray(rawId) ? (rawId[0] || '') : (rawId || '');
  const ad = await prisma.ad.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!ad) return notFound();
  const slug = slugify(ad.title || '');
  permanentRedirect(`/ad/${ad.id}/${slug}`);
}


