import 'dotenv/config';

function parseSquadLabels(raw) {
  const map = {};
  (raw || '').split(',').forEach((pair) => {
    const [label, squad] = pair.split('=').map((s) => (s || '').trim());
    if (label && squad) map[label.toLowerCase()] = squad;
  });
  return map;
}

export const config = {
  jiraBaseUrl: (process.env.JIRA_BASE_URL || '').replace(/\/+$/, ''),
  apiVersion: process.env.JIRA_API_VERSION || '2',
  authMode: process.env.JIRA_AUTH_MODE || 'kerberos',
  email: process.env.JIRA_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || '',
  baseJql: process.env.JIRA_BASE_JQL || '',
  maxResults: Number(process.env.JIRA_MAX_RESULTS || 200),
  squadLabels: parseSquadLabels(process.env.JIRA_SQUAD_LABELS),
  blockedStatusRegex: new RegExp(process.env.JIRA_BLOCKED_STATUS_REGEX || 'block', 'i'),
  defaultProject: process.env.JIRA_DEFAULT_PROJECT || '',
  defaultIssueType: process.env.JIRA_DEFAULT_ISSUETYPE || 'Task',
  port: Number(process.env.PORT || 8787),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Local LLM (chat assistant) - runs entirely on-machine via Ollama, no cloud call,
  // no separate auth: tool calls go through the same Jira auth already configured above.
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'gemma3',
};

export function assertConfigured() {
  if (!config.jiraBaseUrl) {
    throw new Error('JIRA_BASE_URL is not set. Copy server/.env.example to server/.env and fill it in.');
  }
  if (config.authMode === 'token' && (!config.email || !config.apiToken)) {
    throw new Error('JIRA_AUTH_MODE=token requires JIRA_EMAIL and JIRA_API_TOKEN.');
  }
}
