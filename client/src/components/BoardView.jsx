import { dueLabel } from '../utils.js';

export default function BoardView({ statuses, filtered, onOpen, onDrop, dragRef }) {
  return (
    <div className="fd-board">
      {statuses.map((col) => {
        const tickets = filtered.filter((t) => t.status === col.name);
        return (
          <div
            key={col.name}
            className="fd-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.name)}
          >
            <div className="fd-column-head">
              <span className="fd-column-dot" style={{ background: col.color }} />
              <span className="fd-column-name">{col.name}</span>
              <span className="fd-column-count">{tickets.length}</span>
            </div>
            <div className="fd-column-body">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="fd-card"
                  draggable
                  onDragStart={() => { dragRef.current = t.id; }}
                  onClick={() => onOpen(t.id)}
                  style={{ borderLeft: `3px solid ${t.priorityColor || '#8a94a6'}` }}
                >
                  <div className="fd-card-top">
                    <span className="fd-card-id">{t.id}</span>
                    <span className="fd-card-priority" style={{ color: t.priorityColor }}>{t.priority}</span>
                  </div>
                  <div className="fd-card-title">{t.title}</div>
                  <div className="fd-card-labels">
                    {(t.labels || []).map((lab) => (
                      <span key={lab} className="fd-label-chip">{lab}</span>
                    ))}
                  </div>
                  <div className="fd-card-bottom">
                    <span className="fd-card-owner">
                      <span className="fd-avatar fd-avatar-sm" style={{ background: t.ownerColor }}>{t.ownerInitials}</span>
                      <span className="fd-owner-name">{(t.owner || '').split(' ')[0]}</span>
                    </span>
                    <span className="fd-due" style={{ color: t.overdue ? '#e0584d' : 'var(--faint)' }}>{dueLabel(t)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
