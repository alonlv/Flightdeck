import { execFile } from 'node:child_process';
import { config } from './config.js';

class JiraError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status || 502;
    this.body = body;
  }
}

function execFileAsync(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 * 32 }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        err.stdout = stdout;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

// Runs the request through curl's --negotiate flag, which performs the full
// SPNEGO handshake against the local machine's Kerberos ticket cache (kinit).
// Using curl as a subprocess avoids needing the native `kerberos` npm package
// (MIT krb5 dev headers + node-gyp) just to get a Negotiate Authorization header.
async function requestKerberos(method, url, body) {
  const args = [
    '--silent',
    '--show-error',
    '--negotiate',
    '--user',
    ':',
    '--location',
    '--write-out',
    '\n%{http_code}',
    '-X',
    method,
    '-H',
    'Content-Type: application/json',
    '-H',
    'Accept: application/json',
  ];
  if (body !== undefined) {
    args.push('--data', JSON.stringify(body));
  }
  args.push(url);

  let stdout;
  try {
    ({ stdout } = await execFileAsync('curl', args));
  } catch (err) {
    throw new JiraError(
      `Failed to reach Jira via curl --negotiate. Make sure you have a valid Kerberos ticket ` +
        `(run 'klist', or 'kinit you@YOUR.REALM' if empty). Underlying error: ${err.message}`,
      502
    );
  }

  const splitAt = stdout.lastIndexOf('\n');
  const statusCode = Number(stdout.slice(splitAt + 1).trim());
  const rawBody = stdout.slice(0, splitAt === -1 ? 0 : splitAt);
  return parseResponse(statusCode, rawBody);
}

async function requestToken(method, url, body) {
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const rawBody = await res.text();
  return parseResponse(res.status, rawBody);
}

function parseResponse(statusCode, rawBody) {
  if (statusCode === 401 || statusCode === 403) {
    throw new JiraError(
      `Jira rejected the request (HTTP ${statusCode}). ` +
        (config.authMode === 'kerberos'
          ? `Your Kerberos ticket may be missing or expired - run 'kinit' and retry.`
          : `Check JIRA_EMAIL / JIRA_API_TOKEN.`),
      statusCode
    );
  }
  if (statusCode >= 400) {
    throw new JiraError(`Jira returned HTTP ${statusCode}: ${rawBody.slice(0, 500)}`, statusCode, rawBody);
  }
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new JiraError(`Jira returned a non-JSON response (HTTP ${statusCode}).`, 502, rawBody);
  }
}

async function jiraRequest(method, path, body) {
  const url = `${config.jiraBaseUrl}/rest/api/${config.apiVersion}${path}`;
  return config.authMode === 'kerberos' ? requestKerberos(method, url, body) : requestToken(method, url, body);
}

export const jira = {
  async search(jql, { startAt = 0, maxResults = config.maxResults, fields } = {}) {
    return jiraRequest('POST', '/search', {
      jql,
      startAt,
      maxResults,
      fields: fields || [
        'summary',
        'description',
        'assignee',
        'status',
        'priority',
        'duedate',
        'labels',
        'project',
        'issuetype',
        'updated',
      ],
    });
  },
  async getIssue(key) {
    return jiraRequest('GET', `/issue/${encodeURIComponent(key)}`);
  },
  async getTransitions(key) {
    return jiraRequest('GET', `/issue/${encodeURIComponent(key)}/transitions`);
  },
  async transitionIssue(key, transitionId) {
    return jiraRequest('POST', `/issue/${encodeURIComponent(key)}/transitions`, {
      transition: { id: transitionId },
    });
  },
  async updateIssue(key, fields) {
    return jiraRequest('PUT', `/issue/${encodeURIComponent(key)}`, { fields });
  },
  async createIssue(fields) {
    return jiraRequest('POST', '/issue', { fields });
  },
  async deleteIssue(key) {
    return jiraRequest('DELETE', `/issue/${encodeURIComponent(key)}`);
  },
  async getPriorities() {
    return jiraRequest('GET', '/priority');
  },
  async myself() {
    return jiraRequest('GET', '/myself');
  },
  async findAssignableUser(query, projectKey) {
    const qs = new URLSearchParams({ query, project: projectKey || '' });
    return jiraRequest('GET', `/user/assignable/search?${qs.toString()}`);
  },
};

export { JiraError };
