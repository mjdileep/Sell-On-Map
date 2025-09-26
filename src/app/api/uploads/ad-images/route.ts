import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { getS3Client, awsBucket, buildAdImageKey, sanitizeObjectKeyPart } from '@/lib/s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AVIF_TARGET_WIDTHS } from '@/lib/images';

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
    const adId = String(form.get('adId') || '');
    const originalName = String((form.get('filename') as any) || (file as any)?.name || 'upload.bin');
    const groupId = String(form.get('groupId') || '');

    const fileLike: any = file;
    if (!fileLike || typeof fileLike.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if ((fileLike.size ?? 0) > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(fileLike.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const arrayBuffer = await fileLike.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    const key = buildAdImageKey({ userId, adId: adId || undefined, filename: originalName, groupId: groupId || undefined });
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
      console.info('[uploads] pre-put', { requestId, userId, adId, groupId, key, bucket: awsBucket, contentType: fileLike.type, size: fileLike.size });
    }

    await s3.send(put);

    const publicPath = `/asset/${key}`;
    if (debug) {
      console.info('[uploads] success', { requestId, key, url: publicPath });
    }
    return NextResponse.json({ key, url: publicPath }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || 'Unknown error';
    const code = err?.name || err?.code || 'Error';
    const reason = err?.$metadata?.httpStatusCode ? `HTTP ${err.$metadata.httpStatusCode}` : undefined;
    console.error('[uploads] error', { requestId, userId, code, reason, message }, err?.stack || err);
    return NextResponse.json(
      debug
        ? { error: 'Upload failed', requestId, details: { userId, code, reason, message } }
        : { error: 'Upload failed', requestId },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const src = url.searchParams.get('url') || '';
  // Expect src like /asset/ad-images/<user>/<ad>/<group>-<name>-w1200.avif
  const m = src.match(/\/asset\/(ad-images\/.+?)\/(\d+)-(.+?)-w(\d+)\.avif$/);
  if (!m) {
    return NextResponse.json({ error: 'Invalid image url' }, { status: 400 });
  }
  const [, prefix, groupId, basename] = m;

  // Authorize path belongs to user
  const parts = prefix.split('/'); // ['ad-images', '<user>', '<ad>']
  if (parts.length < 3) {
    return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
  }
  const ownerPart = parts[1];
  if (ownerPart !== sanitizeObjectKeyPart(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const s3 = getS3Client();
  const keys = AVIF_TARGET_WIDTHS.map((w) => `${prefix}/${groupId}-${basename}-w${w}.avif`);

  // Attempt best-effort deletes
  const results: { key: string; ok: boolean }[] = [];
  for (const Key of keys) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: awsBucket, Key } as any));
      results.push({ key: Key, ok: true });
    } catch {
      results.push({ key: Key, ok: false });
    }
  }
  return NextResponse.json({ deleted: results.filter(r => r.ok).length, attempted: results.length });
}


