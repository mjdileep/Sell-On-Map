import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getS3Client, awsBucket } from '@/lib/s3';
import { ListObjectsV2Command, DeleteObjectsCommand, type ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function daysAgo(n: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return d;
}

export async function POST() {
	const keepDays = Math.max(0, Number(process.env.IMAGE_RETENTION_DAYS || '0'));
	if (!keepDays) return NextResponse.json({ skipped: true, reason: 'IMAGE_RETENTION_DAYS not set' });

	const threshold = daysAgo(keepDays);
	// Find ads that are inactive and deactivated before threshold
	const expired = await prisma.ad.findMany({
		where: { isActive: false, deactivatedAt: { lt: threshold } },
		select: { id: true, userId: true }
	});

	const s3 = getS3Client();
	let deleted = 0;
	for (const ad of expired) {
		// List under ad-images/{userId}/{adId}/
		const prefix = `ad-images/${ad.userId}/${ad.id}/`;
		let ContinuationToken: string | undefined = undefined;
		do {
			const list: ListObjectsV2CommandOutput = await s3.send(new ListObjectsV2Command({ Bucket: awsBucket, Prefix: prefix, ContinuationToken } as any));
			ContinuationToken = list.NextContinuationToken;
			const objs = (list.Contents || []).map((o) => ({ Key: o.Key! }));
			if (objs.length > 0) {
				await s3.send(new DeleteObjectsCommand({ Bucket: awsBucket, Delete: { Objects: objs } } as any));
				deleted += objs.length;
			}
		} while (ContinuationToken);
	}

	return NextResponse.json({ ads: expired.length, deleted });
}


