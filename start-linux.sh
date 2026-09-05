#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "Dependencies are not installed. Run ./setup-linux.sh first."
  exit 1
fi

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
REQUESTED_FRONTEND_PORT="$FRONTEND_PORT"
REQUESTED_BACKEND_PORT="$BACKEND_PORT"

is_port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$1 )" | tail -n +2 | grep -q .
    return
  fi
  return 1
}

find_free_port() {
  local port="$1"
  while is_port_in_use "$port"; do
    port=$((port + 1))
  done
  echo "$port"
}

SELECTED_BACKEND_PORT="$(find_free_port "$BACKEND_PORT")"
SELECTED_FRONTEND_PORT="$(find_free_port "$FRONTEND_PORT")"
while [ "$SELECTED_FRONTEND_PORT" = "$SELECTED_BACKEND_PORT" ]; do
  SELECTED_FRONTEND_PORT="$(find_free_port "$((SELECTED_FRONTEND_PORT + 1))")"
done
BACKEND_PORT="$SELECTED_BACKEND_PORT"
FRONTEND_PORT="$SELECTED_FRONTEND_PORT"

if [ "$BACKEND_PORT" != "$REQUESTED_BACKEND_PORT" ]; then
  echo "Backend port was busy; using $BACKEND_PORT."
fi
if [ "$FRONTEND_PORT" != "$REQUESTED_FRONTEND_PORT" ]; then
  echo "Frontend port was busy; using $FRONTEND_PORT."
fi

cleanup() {
  trap - INT TERM EXIT
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Starting encrypted-backup backend on port $BACKEND_PORT..."
PORT="$BACKEND_PORT" npm run start:backend &
BACKEND_PID=$!

echo "Starting frontend on port $FRONTEND_PORT..."
VITE_BACKEND_URL="http://127.0.0.1:$BACKEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

echo
echo "ChatVault Viewer: http://127.0.0.1:$FRONTEND_PORT"
echo "Encrypted backup API: http://127.0.0.1:$BACKEND_PORT"
echo "Press Ctrl+C to stop both services."

wait "$FRONTEND_PID"
