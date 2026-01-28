#!/usr/bin/env bash
set -e

echo "== MOGI DEPLOY START =="

echo "→ Show git status (info only)"
git status --porcelain || true

echo "→ Install deps"
npm install

echo "→ Build Next.js"
npm run build

echo "→ Restart service"
sudo systemctl restart mogi

echo "→ Status:"
sudo systemctl status mogi --no-pager

echo "== DEPLOY DONE =="
