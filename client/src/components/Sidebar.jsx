import { LogoMark, BoardIcon, ListIcon, DashboardIcon } from './Icons.jsx';

export default function Sidebar({ view, setView, savedViews, activeViewId, applyView, squads, filters, setSquad, allCount, squadCounts, whoami }) {
  return (
    <aside className="fd-sidebar">
      <div className="fd-brand">
        <div className="fd-brand-mark">
          <LogoMark />
        </div>
        <div className="fd-brand-name">Flightdeck</div>
      </div>

      <nav className="fd-nav">
        <button className={`fd-nav-btn ${view === 'Board' ? 'active' : ''}`} onClick={() => setView('Board')}>
          <BoardIcon /> Board
        </button>
        <button className={`fd-nav-btn ${view === 'List' ? 'active' : ''}`} onClick={() => setView('List')}>
          <ListIcon /> List
        </button>
        <button className={`fd-nav-btn ${view === 'Dashboard' ? 'active' : ''}`} onClick={() => setView('Dashboard')}>
          <DashboardIcon /> Dashboard
        </button>
      </nav>

      <div className="fd-section-label">Saved views</div>
      <div className="fd-list-buttons">
        {savedViews.map((v) => (
          <button key={v.id} className={`fd-view-btn ${activeViewId === v.id ? 'active' : ''}`} onClick={() => applyView(v)}>
            <span className="fd-view-btn-name">{v.name}</span>
            <span className="fd-view-btn-count">{v.count}</span>
          </button>
        ))}
      </div>

      <div className="fd-section-label">Squads</div>
      <div className="fd-list-buttons">
        <button className={`fd-squad-btn ${filters.squad === 'All' ? 'active' : ''}`} onClick={() => setSquad('All')}>
          <span className="fd-squad-dot" style={{ background: '#c3c9d4' }} />
          <span className="fd-squad-name">All squads</span>
          <span className="fd-view-btn-count">{allCount}</span>
        </button>
        {squads.map((s) => (
          <button key={s} className={`fd-squad-btn ${filters.squad === s ? 'active' : ''}`} onClick={() => setSquad(s)}>
            <span className="fd-squad-dot" style={{ background: squadCounts[s]?.dot || '#8a94a6' }} />
            <span className="fd-squad-name">{s}</span>
            <span className="fd-view-btn-count">{squadCounts[s]?.count ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="fd-user-chip">
        <span className="fd-avatar fd-avatar-lg" style={{ background: 'var(--avatarChip)' }}>
          {whoami?.initials || 'EM'}
        </span>
        <div className="fd-user-meta">
          <div className="fd-user-name">{whoami?.displayName || 'You'}</div>
          <div className="fd-user-role">Engineering Manager</div>
        </div>
      </div>
    </aside>
  );
}
