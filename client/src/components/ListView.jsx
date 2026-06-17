import { dueLabel } from '../utils.js';
import { hexToRgba } from '../theme.js';

export default function ListView({ tickets, onOpen, theme }) {
  return (
    <div className="fd-list-wrap">
      <div className="fd-list-table">
        <div className="fd-list-head">
          <span>ID</span><span>Title</span><span>Owner</span><span>Status</span><span>Priority</span><span>Due</span>
        </div>
        {tickets.map((t) => (
          <div key={t.id} className="fd-list-row" onClick={() => onOpen(t.id)}>
            <span className="fd-list-id">{t.id}</span>
            <span className="fd-list-title-col">
              <span className="fd-list-title">{t.title}</span>
              <span className="fd-list-labels">
                {(t.labels || []).map((lab) => (
                  <span key={lab} className="fd-list-label-chip">{lab}</span>
                ))}
              </span>
            </span>
            <span className="fd-list-owner">
              <span className="fd-avatar fd-avatar-sm" style={{ background: t.ownerColor }}>{t.ownerInitials}</span>
              <span className="fd-list-owner-name">{t.owner}</span>
            </span>
            <span>
              <span
                className="fd-status-pill"
                style={{ color: t.statusColor, background: hexToRgba(t.statusColor, theme === 'dark' ? 0.18 : 0.12) }}
              >
                {t.status}
              </span>
            </span>
            <span className="fd-priority-cell">
              <span className="fd-priority-dot" style={{ background: t.priorityColor }} />
              <span className="fd-priority-text">{t.priority}</span>
            </span>
            <span className="fd-due-cell" style={{ color: t.overdue ? '#e0584d' : 'var(--faint)' }}>{dueLabel(t)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
