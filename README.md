# SellOnMap

Next.js 15 app with Prisma + Postgres and NextAuth (Google + Credentials).

## Setup

1. Copy `.env.example` to `.env` and fill values:
   - `DATABASE_URL` (PostgreSQL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_MAPTILER_API_KEY`
   - `AD_ACTIVE_DAYS`, `MAX_ACTIVE_ADS_PER_USER`

2. Install and generate Prisma client:

```bash
npm i
npx prisma migrate deploy
npx prisma generate
```

3. Run dev:

```bash
npm run dev
```

## Features
- Google or email+password sign-in (`/signin`, `/signup`)
- Create ads via map UI; ads auto-expire after N days
- Reactivate an ad via `POST /api/ads/:id/reactivate` (subject to max active ads)
- Marketplace at `/` using DB-backed `/api/ads`

## Scheduled tasks
- Call `POST /api/admin/cron/deactivate-expired` periodically (e.g. with a platform cron) to deactivate expired ads.

## Production
- Set strong `NEXTAUTH_SECRET`
- Configure HTTPS and custom domain
- Ensure database backups and connection pool (e.g. Prisma Accelerate or pgbouncer)
- Review `next.config.mjs` headers

## Images and S3 Uploads

Ad photos are uploaded to an S3 bucket folder `ad-images/` via `POST /api/uploads/ad-images` and are served through `/asset/ad-images/...` with long-lived cache headers.

Environment variables (set in deployment):

- `AWS_S3_BUCKET` — target bucket name (e.g. cdn-yepstay)
- `AWS_S3_REGION` — bucket region (e.g. ap-southeast-1)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — optional; if not set, Lightsail/EC2 role credentials are used.
- `AD_ACTIVE_DAYS`, `MAX_ACTIVE_ADS_PER_USER` — existing app settings

Nginx caching: upstream responses include `Cache-Control: public, max-age=31536000, immutable`. Enable proxy cache at Nginx for `/asset/` to accelerate image loads.

Client usage: all Create Ad modals and the Edit form include an image uploader; uploaded URLs are stored in `Ad.photos`.


To collect logs in production:
- Enable debug temporarily:
```bash
ssh ubuntu@54.179.160.125 'export APP_NAME=sellonmap; cd /home/ubuntu/sellonmap && pm2 set env:UPLOADS_DEBUG true && pm2 restart $APP_NAME --update-env | cat'
```
- Tail logs:
```bash
ssh ubuntu@54.179.160.125 'pm2 logs sellonmap --lines 200 | cat'
```
- Disable debug:
```bash
ssh ubuntu@54.179.160.125 'export APP_NAME=sellonmap; pm2 set env:UPLOADS_DEBUG false && pm2 restart $APP_NAME --update-env | cat'
```

What you’ll see:
- On each POST failure: a line like “[uploads] error” with requestId, userId, code, reason, and message, plus stack.
- On success: “[uploads] success” with the key and URL.
- S3 client init line “[s3] init” with region/bucket and whether explicit credentials were used.

If you want, I can deploy now so PM2 log rotation applies and you can toggle debug and test an upload.