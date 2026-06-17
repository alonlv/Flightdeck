import { hexToRgba } from '../theme.js';

export default function DashboardView({ filtered, statuses, onOpen, theme }) {
  const kpiOpen = filtered.filter((t) => t.statusCategory !== 'done').length;
  const kpiProgress = filtered.filter((t) => t.statusCategory === 'indeterminate' && !t.blocked).length;
  const kpiBlocked = filtered.filter((t) => t.blocked).length;
  const kpiOverdue = filtered.filter((t) => t.overdue).length;

  const sCounts = statuses.map((s) => filtered.filter((t) => t.status === s.name).length);
  const sMax = Math.max(1, ...sCounts);
  const statusBars = statuses.map((s, i) => ({ label: s.name, color: s.color, count: sCounts[i], pct: Math.round((sCounts[i] / sMax) * 100) }));

  const byOwner = {};
  filtered.forEach((t) => { if (t.statusCategory !== 'done') byOwner[t.owner] = (byOwner[t.owner] || 0) + 1; });
  const oEntries = Object.entries(byOwner).sort((a, b) => b[1] - a[1]);
  const oMax = Math.max(1, ...oEntries.map((e) => e[1]));
  const ownerMeta = {};
  filtered.forEach((t) => { ownerMeta[t.owner] = { initials: t.ownerInitials, color: t.ownerColor }; });
  const ownerBars = oEntries.map(([name, count]) => ({
    name, count, pct: Math.round((count / oMax) * 100), ...(ownerMeta[name] || { initials: '?', color: '#9aa2b2' }),
  }));

  const pOrder = {};
  statuses.forEach((s, i) => { pOrder[s.name] = i; });
  const attention = filtered
    .filter((t) => t.blocked || t.overdue)
    .sort((a, b) => (a.due && b.due ? new Date(a.due) - new Date(b.due) : 0))
    .map((t) => {
      const reason = t.blocked ? 'Blocked' : 'Overdue';
      const reasonColor = t.blocked ? '#e0584d' : '#ec7a4c';
      const reasonBg = hexToRgba(t.blocked ? '#d4493f' : '#e0683a', theme === 'dark' ? 0.2 : 0.12);
      return { ...t, reason, reasonColor, reasonBg };
    });

  return (
    <div className="fd-dash">
      <div className="fd-kpis">
        <KpiCard label="Open tickets" value={kpiOpen} sub="in current view" />
        <KpiCard label="In progress" value={kpiProgress} sub="actively worked" color="var(--accent)" />
        <KpiCard label="Blocked" value={kpiBlocked} sub="need unblocking" color="#e0584d" />
        <KpiCard label="Overdue" value={kpiOverdue} sub="past due date" color="#ec7a4c" />
      </div>

      <div className="fd-dash-grid">
        <div className="fd-dash-col">
          <div className="fd-panel">
            <div className="fd-panel-title">Tickets by status</div>
            <div className="fd-bars">
              {statusBars.map((s) => (
                <div key={s.label} className="fd-bar-row">
                  <span className="fd-bar-label">{s.label}</span>
                  <span className="fd-bar-track"><span className="fd-bar-fill" style={{ width: `${s.pct}%`, background: s.color }} /></span>
                  <span className="fd-bar-count">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fd-panel">
            <div className="fd-panel-title">Workload by owner</div>
            <div className="fd-owner-bars">
              {ownerBars.map((o) => (
                <div key={o.name} className="fd-owner-bar-row">
                  <span className="fd-avatar fd-avatar-sm" style={{ background: o.color }}>{o.initials}</span>
                  <span className="fd-owner-bar-name">{o.name}</span>
                  <span className="fd-bar-track"><span className="fd-bar-fill" style={{ width: `${o.pct}%`, background: o.color }} /></span>
                  <span className="fd-bar-count">{o.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fd-panel">
          <div className="fd-panel-head">
            <span className="fd-panel-title" style={{ marginBottom: 0 }}>Needs attention</span>
            <span className="fd-attention-count">{attention.length}</span>
          </div>
          <div className="fd-attention-list">
            {attention.map((t) => (
              <div key={t.id} className="fd-attention-item" onClick={() => onOpen(t.id)}>
                <span className="fd-avatar fd-avatar-md" style={{ background: t.ownerColor }}>{t.ownerInitials}</span>
                <span className="fd-attention-body">
                  <span className="fd-attention-title">{t.title}</span>
                  <span className="fd-attention-meta">{t.id} · {(t.owner || '').split(' ')[0]}</span>
                </span>
                <span className="fd-attention-reason" style={{ color: t.reasonColor, background: t.reasonBg }}>{t.reason}</span>
              </div>
            ))}
            {attention.length === 0 && <div className="fd-empty-state">Nothing blocked or overdue.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="fd-kpi-card">
      <span className="fd-kpi-label">{label}</span>
      <span className="fd-kpi-value" style={color ? { color } : undefined}>{value}</span>
      <span className="fd-kpi-sub">{sub}</span>
    </div>
  );
}
