import { NextResponse } from 'next/server';
import { getS3Client, awsBucket } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = Array.isArray(path) ? path.join('/') : String(path || '');
  if (!key || (!key.startsWith('ad-images/') && !key.startsWith('profile-images/'))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const s3 = getS3Client();
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: awsBucket, Key: key }));
    const body = res.Body as any;
    const stream = body?.transformToWebStream ? await body.transformToWebStream() : body;
    const headers = new Headers();
    if (res.ContentType) headers.set('Content-Type', res.ContentType);
    const cacheSeconds = 60 * 60 * 24 * 365; // 1 year
    const dev = process.env.NODE_ENV !== 'production';
    headers.set('Cache-Control', dev ? 'no-store' : `public, max-age=${cacheSeconds}, immutable`);
    if (res.ETag) headers.set('ETag', res.ETag.replaceAll('"', ''));
    if (res.ContentLength) headers.set('Content-Length', String(res.ContentLength));
    if (res.LastModified) headers.set('Last-Modified', res.LastModified.toUTCString());
    headers.set('Accept-Ranges', 'bytes');
    return new NextResponse(stream as any, { status: 200, headers });
  } catch (_err) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}


