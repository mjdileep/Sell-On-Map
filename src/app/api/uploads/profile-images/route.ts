import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { getS3Client, awsBucket, buildProfileImageKey, sanitizeObjectKeyPart } from '@/lib/s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseContentDisposition(filename: string) {
  return `inline; filename="${filename.replace(/"/g, '')}"`;
}

export async function POST(request: Request) {
  const debug = process.env.UPLOADS_DEBUG === 'true';
  const requestId = Math.random().toString(36).slice(2);
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get('file');
    const originalName = String((form.get('filename') as any) || (file as any)?.name || 'avatar.avif');
    const widthStr = String(form.get('width') || '');
    const width = widthStr ? parseInt(widthStr, 10) : undefined;

    const fileLike: any = file;
    if (!fileLike || typeof fileLike.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB for avatars
    if ((fileLike.size ?? 0) > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
    }

    const allowed = ['image/avif', 'image/webp', 'image/jpeg', 'image/png'];
    if (!allowed.includes(fileLike.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const arrayBuffer = await fileLike.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const key = buildProfileImageKey({ userId, filename: originalName, variant: 'avatar', width });
    const s3 = getS3Client();

    const cacheSeconds = 60 * 60 * 24 * 365; // 1 year immutable
    const put = new PutObjectCommand({
      Bucket: awsBucket,
      Key: key,
      Body: body,
      ContentType: fileLike.type,
      ContentDisposition: parseContentDisposition(originalName),
      CacheControl: `public, max-age=${cacheSeconds}, immutable`,
      ACL: 'public-read',
    } as any);

    if (debug) {
      console.info('[uploads.profile] pre-put', { requestId, userId, key, bucket: awsBucket, contentType: fileLike.type, size: fileLike.size });
    }

    await s3.send(put);

    const publicPath = `/asset/${key}`;
    if (debug) {
      console.info('[uploads.profile] success', { requestId, key, url: publicPath });
    }
    return NextResponse.json({ key, url: publicPath }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || 'Unknown error';
    const code = err?.name || err?.code || 'Error';
    const reason = err?.$metadata?.httpStatusCode ? `HTTP ${err.$metadata.httpStatusCode}` : undefined;
    console.error('[uploads.profile] error', { requestId, userId, code, reason, message }, err?.stack || err);
    return NextResponse.json({ error: 'Upload failed', requestId }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const src = url.searchParams.get('url') || '';
  // Expect src like /asset/profile-images/<user>/<basename>-avatar-w{width}.avif
  const m = src.match(/^\/asset\/(profile-images\/([^/]+)\/[^/]+-avatar-w\d+\.avif)$/);
  if (!m) {
    return NextResponse.json({ error: 'Invalid image url' }, { status: 400 });
  }
  const [, key, ownerPart] = m;

  if (ownerPart !== sanitizeObjectKeyPart(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const s3 = getS3Client();
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: awsBucket, Key: key } as any));
    return NextResponse.json({ deleted: 1 });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}


