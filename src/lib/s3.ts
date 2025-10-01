import { S3Client } from '@aws-sdk/client-s3';

const requiredEnv = [
  'AWS_S3_BUCKET',
  'AWS_S3_REGION',
  // Credentials may be provided via env or instance profile/role
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    // Do not throw to allow local dev without S3; APIs will validate again
    // console.warn(`[s3] Missing env ${key}`);
  }
}

export const awsBucket = process.env.AWS_S3_BUCKET || 'cdn-yepstay';
export const awsRegion = process.env.AWS_S3_REGION || 'ap-southeast-1';

let singleton: S3Client | null = null;

export function getS3Client(): S3Client {
  if (singleton) return singleton;
  const region = awsRegion;
  const credentials = (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    ? { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! }
    : undefined; // allow IAM role on Lightsail/EC2

  const debug = process.env.UPLOADS_DEBUG === 'true' || process.env.S3_DEBUG === 'true';
  if (debug) {
    console.info('[s3] init', {
      region,
      bucket: awsBucket,
      explicitCredentials: Boolean(credentials),
      accessKeyPreview: credentials?.accessKeyId ? `${credentials.accessKeyId.slice(0, 4)}...${credentials.accessKeyId.slice(-4)}` : undefined,
      env: {
        AWS_S3_BUCKET: Boolean(process.env.AWS_S3_BUCKET),
        AWS_S3_REGION: Boolean(process.env.AWS_S3_REGION),
        AWS_ACCESS_KEY_ID: Boolean(process.env.AWS_ACCESS_KEY_ID),
        AWS_SECRET_ACCESS_KEY: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
      },
    });
  }

  singleton = new S3Client({ region, credentials });
  return singleton;
}

export function getAdImagesPrefix() {
  // All ad images will live under this folder in the bucket
  return 'ad-images/';
}

export function getProfileImagesPrefix() {
  // All profile images will live under this folder in the bucket
  return 'profile-images/';
}

export function sanitizeObjectKeyPart(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9/_.-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

export function buildAdImageKey(opts: { userId: string; adId?: string; filename: string; groupId?: string | number }): string {
  const user = sanitizeObjectKeyPart(opts.userId);
  const ad = opts.adId ? sanitizeObjectKeyPart(opts.adId) : 'unassigned';
  const file = sanitizeObjectKeyPart(opts.filename);
  const group = String(typeof opts.groupId === 'undefined' ? Date.now() : opts.groupId).replace(/[^0-9]/g, '');
  return `${getAdImagesPrefix()}${user}/${ad}/${group}-${file}`;
}

export function buildProfileImageKey(opts: { userId: string; filename: string; variant?: 'original' | 'avatar'; width?: number }): string {
  const user = sanitizeObjectKeyPart(opts.userId);
  const match = String(opts.filename || '').match(/^(.*?)(\.[^.]+)?$/);
  const base = sanitizeObjectKeyPart((match?.[1] || 'avatar').replace(/\.+$/, ''));
  const ext = (match?.[2] || '.avif').replace(/[^a-zA-Z0-9.]/g, '') || '.avif';
  const variant = opts.variant || 'avatar';
  const widthSuffix = (typeof opts.width === 'number' && Number.isFinite(opts.width)) ? `-w${opts.width}` : '';
  return `${getProfileImagesPrefix()}${user}/${base}-${variant}${widthSuffix}${ext}`;
}


