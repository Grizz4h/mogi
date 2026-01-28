#!/usr/bin/env bash
set -euo pipefail

cd /opt/mogi

npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/
# Public assets sauber in standalone/public ablegen (ohne public/public nesting)
rm -rf .next/standalone/public
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/
sudo systemctl restart mogi
sudo systemctl status mogi --no-pager
