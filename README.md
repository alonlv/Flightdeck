# Flightdeck

A lightweight presentation layer over your real Jira board: a Kanban/List/Dashboard UI
with click-to-edit tickets and a simple chat assistant, backed by a thin Express proxy
that talks to Jira directly (no local copy of your data, no separate database).

- **Client**: React + Vite (`client/`)
- **Server**: Node/Express Jira proxy (`server/`)

## How it works

The server fetches the issues in scope (via a JQL query you configure) from your Jira
instance on each refresh, maps them into the shapes the UI needs, and serves them to the
client. Edits, status moves, creates, and deletes in the UI write straight back to Jira
through its REST API — Flightdeck holds no ticket data of its own.

## Prerequisites

- Node.js 18+
- Access to your company's Jira Server/Data Center instance (REST API v2)
- For Kerberos auth (the default): a `curl` build with GSS-API/SPNEGO support
  (`curl -V | grep -i gss`) and a valid ticket in your local credential cache
  (`kinit you@YOUR.REALM`, verify with `klist`)
- Optional, for the chat assistant: [Ollama](https://ollama.com) running locally with a
  model pulled (default `gemma3`) — see [Chat assistant](#chat-assistant-local-llm) below.

## Setup

```bash
cd server
cp .env.example .env
# edit .env: set JIRA_BASE_URL, JIRA_AUTH_MODE, JIRA_BASE_JQL, JIRA_SQUAD_LABELS, etc.
npm install
npm run dev      # starts the API on :8787

cd ../client
npm install
npm run dev       # starts Vite on :5173, proxying /api to :8787
```

Open http://localhost:5173.

## Configuration (`server/.env`)

See `server/.env.example` for the full list with inline docs. The notable ones:

- `JIRA_AUTH_MODE` — `kerberos` (shells out to `curl --negotiate` using your machine's
  ticket cache) or `token` (HTTP Basic auth with an Atlassian API token, for non-Kerberos
  Jira instances).
- `JIRA_BASE_JQL` — the slice of Jira this app is allowed to see (e.g.
  `project in (ENG, INFRA)`). All board/list/dashboard filtering happens client-side
  within this scope after a single fetch.
- `JIRA_SQUAD_LABELS` — "Squad" isn't a native Jira field. It's resolved per ticket as:
  1. a label on the issue matching a `label=Squad` pair in this list, else
  2. the issue's Jira project name.

  Edits to the Squad field write back as a label swap when a mapping exists; otherwise
  the save still succeeds but surfaces a warning that the squad couldn't be persisted.
- `JIRA_BLOCKED_STATUS_REGEX` — case-insensitive pattern matched against the issue's
  status name to flag it as blocked for the dashboard/chat, independent of your
  workflow's exact status names.
- Statuses and priorities are not hardcoded — they're derived from whatever your Jira
  instance actually returns.

## Chat assistant (local LLM)

The chat panel is backed by [Ollama](https://ollama.com) running Google's open-source
Gemma model — entirely on your machine, no Docker, no cloud API key, no extra
authentication. It's intentionally the lightest option: a single local daemon instead of
a container runtime.

```bash
# once:
curl -fsSL https://ollama.com/install.sh | sh   # or brew install ollama
ollama pull gemma3

# Ollama usually runs as a background service already; if not:
ollama serve
```

The assistant has tool access to the same ticket operations the UI uses (list, get,
create, update/transition, delete) — so it can answer questions about the live board
*and* act on it ("move ENG-1 to In Review", "create a bug for the login redirect",
"who's overloaded"). Every tool call goes through the exact same Jira auth you configured
above (Kerberos or token); the LLM never talks to Jira directly and needs no credentials
of its own.

If Ollama isn't installed or running, the chat panel silently falls back to a small set
of canned, regex-matched replies (blocked/overdue/workload/standup summaries, plus
`create: <title>`) so the rest of the app is unaffected.

Configure the model/host in `server/.env`:

```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3
```

## Notes

- Status changes go through Jira's workflow transitions API (`/issue/{key}/transitions`);
  if no transition exists between the current and requested status, the save is rejected
  with the list of valid target statuses.
- Ticket description is plain text (Jira Server/DC v2 API), not Atlassian Document Format.
