import express from 'express';
import { config } from '../config.js';
import { jira, JiraError } from '../jiraClient.js';
import { buildJql, toTicket, labelForSquad } from '../mapping.js';
import { priorityColorByRank } from '../colors.js';

export const router = express.Router();

async function fetchAllIssues(jql) {
  const pageSize = 100;
  let startAt = 0;
  let total = Infinity;
  const issues = [];
  while (startAt < total && issues.length < config.maxResults) {
    const page = await jira.search(jql, { startAt, maxResults: pageSize });
    issues.push(...page.issues);
    total = page.total;
    startAt += page.issues.length;
    if (page.issues.length === 0) break;
  }
  return issues.slice(0, config.maxResults);
}

function buildMeta(tickets, priorityOrder) {
  const engineerMap = new Map();
  const squads = new Set();
  const labels = new Set();
  const statusMap = new Map();

  tickets.forEach((t) => {
    if (t.owner && t.owner !== 'Unassigned' && !engineerMap.has(t.owner)) {
      engineerMap.set(t.owner, { name: t.owner, key: t.ownerKey, initials: t.ownerInitials, color: t.ownerColor });
    }
    squads.add(t.squad);
    (t.labels || []).forEach((l) => labels.add(l));
    if (!statusMap.has(t.status)) {
      statusMap.set(t.status, { name: t.status, color: t.statusColor, category: t.statusCategory, blocked: t.blocked });
    }
  });

  const priorities =
    priorityOrder && priorityOrder.length
      ? priorityOrder.map((name, i) => ({ name, color: priorityColorByRank(i) }))
      : Array.from(new Set(tickets.map((t) => t.priority))).map((name, i) => ({ name, color: priorityColorByRank(i) }));

  return {
    engineers: Array.from(engineerMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    squads: Array.from(squads).sort(),
    labels: Array.from(labels).sort(),
    statuses: Array.from(statusMap.values()),
    priorities,
  };
}

router.get('/tickets', async (req, res, next) => {
  try {
    const jql = buildJql(config.baseJql);
    const issues = await fetchAllIssues(jql);
    const tickets = issues.map(toTicket);

    let priorityOrder = null;
    try {
      const priorities = await jira.getPriorities();
      priorityOrder = priorities.map((p) => p.name);
    } catch {
      // Non-fatal - fall back to deriving priority list from the tickets themselves.
    }

    res.json({ tickets, meta: buildMeta(tickets, priorityOrder), total: tickets.length });
  } catch (err) {
    next(err);
  }
});

router.get('/tickets/:id', async (req, res, next) => {
  try {
    const issue = await jira.getIssue(req.params.id);
    res.json(toTicket(issue));
  } catch (err) {
    next(err);
  }
});

router.post('/tickets', async (req, res, next) => {
  try {
    const d = req.body || {};
    const fields = {
      project: { key: config.defaultProject },
      issuetype: { name: config.defaultIssueType },
      summary: d.title || 'New ticket',
      description: d.description || '',
      labels: d.labels || [],
    };
    if (d.priority) fields.priority = { name: d.priority };
    if (d.due) fields.duedate = d.due;
    if (d.ownerKey) fields.assignee = { name: d.ownerKey };

    const squadLabel = d.squad ? labelForSquad(d.squad) : null;
    if (squadLabel) fields.labels = Array.from(new Set([...fields.labels, squadLabel]));

    const created = await jira.createIssue(fields);
    const issue = await jira.getIssue(created.key);
    res.status(201).json(toTicket(issue));
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id', async (req, res, next) => {
  const key = req.params.id;
  const d = req.body || {};
  const warnings = [];
  try {
    const current = await jira.getIssue(key);
    const currentTicket = toTicket(current);

    const fields = {};
    if (d.title !== undefined) fields.summary = d.title;
    if (d.description !== undefined) fields.description = d.description;
    if (d.due !== undefined) fields.duedate = d.due || null;
    if (d.priority !== undefined) fields.priority = { name: d.priority };
    if (d.labels !== undefined) fields.labels = d.labels;
    if (d.ownerKey !== undefined) fields.assignee = d.ownerKey ? { name: d.ownerKey } : null;

    if (d.squad !== undefined && d.squad !== currentTicket.squad) {
      const newLabel = labelForSquad(d.squad);
      if (newLabel) {
        const baseLabels = d.labels !== undefined ? fields.labels : current.fields.labels || [];
        const otherSquadLabels = Object.keys(config.squadLabels);
        fields.labels = Array.from(new Set([...baseLabels.filter((l) => !otherSquadLabels.includes(l.toLowerCase())), newLabel]));
      } else {
        warnings.push(`"${d.squad}" has no configured label mapping (JIRA_SQUAD_LABELS) - squad change was not written back to Jira; it's inferred from the project instead.`);
      }
    }

    if (Object.keys(fields).length) {
      await jira.updateIssue(key, fields);
    }

    if (d.status !== undefined && d.status !== currentTicket.status) {
      const { transitions } = await jira.getTransitions(key);
      const match = transitions.find((t) => t.to.name.toLowerCase() === d.status.toLowerCase());
      if (!match) {
        const available = transitions.map((t) => t.to.name).join(', ') || 'none';
        return res.status(409).json({
          error: `No workflow transition from "${currentTicket.status}" to "${d.status}". Available targets: ${available}.`,
        });
      }
      await jira.transitionIssue(key, match.id);
    }

    const updated = await jira.getIssue(key);
    res.json({ ticket: toTicket(updated), warnings });
  } catch (err) {
    next(err);
  }
});

router.delete('/tickets/:id', async (req, res, next) => {
  try {
    await jira.deleteIssue(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof JiraError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || 'Unexpected server error' });
});
