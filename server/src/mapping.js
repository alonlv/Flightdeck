import { config } from './config.js';
import { colorFor, initialsFor, statusColor } from './colors.js';

export function resolveSquad(issue) {
  const labels = issue.fields.labels || [];
  for (const label of labels) {
    const mapped = config.squadLabels[label.toLowerCase()];
    if (mapped) return mapped;
  }
  return issue.fields.project ? issue.fields.project.name : 'Unassigned';
}

export function isBlocked(statusName) {
  return config.blockedStatusRegex.test(statusName || '');
}

export function isDue(statusCategoryKey) {
  return statusCategoryKey !== 'done';
}

export function isOverdue(due, statusCategoryKey) {
  if (!due || statusCategoryKey === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${due}T00:00:00`) < today;
}

export function toTicket(issue) {
  const f = issue.fields;
  const owner = f.assignee ? f.assignee.displayName : 'Unassigned';
  const statusName = f.status ? f.status.name : 'Unknown';
  const categoryKey = f.status?.statusCategory?.key || 'new';
  const blocked = isBlocked(statusName);
  const priorityName = f.priority ? f.priority.name : 'None';

  return {
    id: issue.key,
    title: f.summary || '(no title)',
    description: f.description || '',
    owner,
    ownerKey: f.assignee ? f.assignee.accountId || f.assignee.key || f.assignee.name : null,
    ownerInitials: initialsFor(owner),
    ownerColor: colorFor(owner),
    status: statusName,
    statusCategory: categoryKey,
    blocked,
    statusColor: statusColor(statusName, categoryKey, blocked),
    priority: priorityName,
    squad: resolveSquad(issue),
    due: f.duedate || null,
    overdue: isOverdue(f.duedate, categoryKey),
    labels: f.labels || [],
    project: f.project ? { key: f.project.key, name: f.project.name } : null,
    issuetype: f.issuetype ? f.issuetype.name : null,
    updated: f.updated || null,
  };
}

// All UI filtering (status/priority/owner/squad/label/search) happens client-side
// against the full fetched set, same as the original design's in-memory filter -
// "squad" especially has to, since it's a derived field, not a queryable one.
// JQL here only defines the *scope* Flightdeck is allowed to see (JIRA_BASE_JQL).
export function buildJql(baseJql) {
  return `${baseJql} order by updated desc`;
}

// Reverse-lookup: given a desired squad name, find the label that maps to it
// (if any) so we can write the squad back as a label change.
export function labelForSquad(squad) {
  const entry = Object.entries(config.squadLabels).find(([, v]) => v === squad);
  return entry ? entry[0] : null;
}
