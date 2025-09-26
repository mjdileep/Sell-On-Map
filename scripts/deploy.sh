#!/usr/bin/env bash
set -euo pipefail

# ==== Config (edit as needed) ====
REMOTE_USER="ubuntu"
REMOTE_HOST="54.179.160.125"
REMOTE_DIR="/home/ubuntu/sellonmap"
APP_NAME="sellonmap"
APP_PORT="3054"

echo "==> Building Next.js app"
npm run build

echo "==> Streaming all deploy artifacts in one SSH session (single passphrase prompt)"

# Build list of files/dirs to include
INCLUDES=(.next server.js package.json package-lock.json)
[ -d public ] && INCLUDES+=(public)
[ -d prisma ] && INCLUDES+=(prisma)

# Create remote directory and extract streamed tar, then install and restart
tar -czf - "${INCLUDES[@]}" | ssh ${REMOTE_USER}@${REMOTE_HOST} "\
  set -euo pipefail; \
  mkdir -p ${REMOTE_DIR}; \
  cd ${REMOTE_DIR}; \
  tar -xzf -; \
  if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi; \
  npx prisma generate; \
  npx prisma migrate deploy || true; \
  if ! command -v pm2 >/dev/null 2>&1; then npm i -g pm2 || sudo npm i -g pm2 || true; fi; \
  PORT=${APP_PORT} NODE_ENV=production pm2 describe ${APP_NAME} >/dev/null 2>&1 && \
    pm2 restart ${APP_NAME} --update-env || \
    PORT=${APP_PORT} NODE_ENV=production pm2 start server.js --name ${APP_NAME}; \
  # Install and configure pm2-logrotate for safe log growth in production\
  pm2 install pm2-logrotate || true; \
  pm2 set pm2-logrotate:max_size 10M || true; \
  pm2 set pm2-logrotate:retain 14 || true; \
  pm2 set pm2-logrotate:compress true || true; \
  pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss || true; \
  pm2 set pm2-logrotate:rotateInterval 0 0 * * * || true; \
  pm2 set pm2-logrotate:rotateModule true || true; \
  pm2 save || true; \
  echo 'Deployed ${APP_NAME} to ${REMOTE_HOST}:${APP_PORT}'; \
"

echo "==> Done."


