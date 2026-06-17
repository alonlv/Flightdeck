// Deterministic colors for things Jira doesn't give us a hex code for
// (people, labels-as-squads, arbitrary status names) - same input always
// produces the same color, so the UI stays stable across refreshes.

const PALETTE = ['#2a6fdb', '#1f8a5b', '#6d5ae6', '#e0683a', '#0e7c86', '#b4458a', '#c9821a', '#4a63d0'];

const PRIORITY_PALETTE = ['#d4493f', '#e0683a', '#c9821a', '#2a6fdb', '#8a94a6'];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorFor(name, palette = PALETTE) {
  if (!name) return palette[palette.length - 1];
  return palette[hashString(name) % palette.length];
}

export function initialsFor(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// statusCategory.key from Jira is one of: 'new' | 'indeterminate' | 'done'
const CATEGORY_BASE_COLOR = { new: '#8a94a6', indeterminate: '#2a6fdb', done: '#1f8a5b' };

export function statusColor(statusName, categoryKey, isBlocked) {
  if (isBlocked) return '#d4493f';
  return CATEGORY_BASE_COLOR[categoryKey] || colorFor(statusName, PALETTE);
}

export function priorityColorByRank(rank) {
  return PRIORITY_PALETTE[Math.min(rank, PRIORITY_PALETTE.length - 1)];
}
