const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(due) {
  if (!due) return '—';
  const d = new Date(`${due}T00:00:00`);
  if (Number.isNaN(d.getTime())) return due;
  return `${MON[d.getMonth()]} ${d.getDate()}`;
}

export function dueLabel(ticket) {
  if (!ticket.due) return '—';
  return ticket.overdue ? `${fmtDate(ticket.due)} · late` : fmtDate(ticket.due);
}

export const EMPTY_FILTERS = { search: '', status: 'All', priority: 'All', owner: 'All', squad: 'All', label: 'All' };

export function applyFilters(list, f) {
  const q = (f.search || '').toLowerCase();
  return list.filter((t) => {
    if (q && !(t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return false;
    if (f.status !== 'All' && t.status !== f.status) return false;
    if (f.priority !== 'All' && t.priority !== f.priority) return false;
    if (f.owner !== 'All' && t.owner !== f.owner) return false;
    if (f.squad !== 'All' && t.squad !== f.squad) return false;
    if (f.label !== 'All' && !(t.labels || []).includes(f.label)) return false;
    return true;
  });
}

export function filtersDirty(f) {
  return !!(f.search || f.status !== 'All' || f.priority !== 'All' || f.owner !== 'All' || f.squad !== 'All' || f.label !== 'All');
}

const STATUS_CATEGORY_ORDER = { new: 0, indeterminate: 1, done: 2 };

export function sortStatuses(statuses) {
  return [...statuses].sort((a, b) => {
    const ca = STATUS_CATEGORY_ORDER[a.category] ?? 1;
    const cb = STATUS_CATEGORY_ORDER[b.category] ?? 1;
    if (ca !== cb) return ca - cb;
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

const SQUAD_PALETTE = ['#2a6fdb', '#6d5ae6', '#e0683a', '#1f8a5b', '#0e7c86', '#b4458a', '#c9821a', '#4a63d0'];

export function colorForName(name) {
  if (!name) return SQUAD_PALETTE[SQUAD_PALETTE.length - 1];
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h << 5) - h + name.charCodeAt(i); h |= 0; }
  return SQUAD_PALETTE[Math.abs(h) % SQUAD_PALETTE.length];
}

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable - non-fatal
  }
}
