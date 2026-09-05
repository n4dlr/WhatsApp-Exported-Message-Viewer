#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18+ is required. Install Node.js and run this script again."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js 22+ is required for native large SQLite support. Found: $(node --version)"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install npm and run this script again."
  exit 1
fi

mkdir -p tmp
npm install --legacy-peer-deps
npm run build

echo
echo "Setup complete."
echo "Start development mode with: ./start-linux.sh"
