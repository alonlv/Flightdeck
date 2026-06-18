#!/usr/bin/env bash
# Starts everything Flightdeck needs: the local LLM (Ollama + Gemma), the API
# server, and the client dev server - in one command.
set -euo pipefail
cd "$(dirname "$0")"

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-gemma3}"
PIDS=()

cleanup() {
  echo
  echo "Stopping..."
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT INT TERM

# --- Ollama (chat assistant) ---
if ! command -v ollama >/dev/null 2>&1; then
  echo "==> Ollama not installed - chat assistant will fall back to canned replies."
  echo "    Install from https://ollama.com, then re-run this script for full LLM chat."
elif curl -fsS -m 2 "$OLLAMA_HOST/api/version" >/dev/null 2>&1; then
  echo "==> Ollama already running at $OLLAMA_HOST"
else
  echo "==> Starting Ollama..."
  ollama serve >/tmp/flightdeck-ollama.log 2>&1 &
  PIDS+=($!)
  for i in $(seq 1 20); do
    curl -fsS -m 1 "$OLLAMA_HOST/api/version" >/dev/null 2>&1 && break
    sleep 0.5
  done
fi

if command -v ollama >/dev/null 2>&1 && ! ollama list 2>/dev/null | grep -q "^$OLLAMA_MODEL"; then
  echo "==> Pulling $OLLAMA_MODEL (first run only, this can take a while)..."
  ollama pull "$OLLAMA_MODEL"
fi

# --- API server ---
echo "==> Starting server (http://localhost:8787)..."
(cd server && npm run dev) &
PIDS+=($!)

# --- Client dev server ---
echo "==> Starting client (http://localhost:5173)..."
(cd client && npm run dev) &
PIDS+=($!)

wait
