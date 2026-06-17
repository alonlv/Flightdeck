export default function EditModal({
  draft, setDraftField, onClose, onSave, onDelete, saving, loading, error, warning,
  engineers, squads, statuses, priorities, isNew,
}) {
  if (loading) {
    return (
      <Overlay onClose={onClose}>
        <div className="fd-center-state" style={{ padding: 60 }}>Loading ticket…</div>
      </Overlay>
    );
  }
  if (!draft) return null;

  const priorityColor = priorities.find((p) => p.name === draft.priority)?.color || '#8a94a6';

  return (
    <Overlay onClose={onClose}>
      <div className="fd-modal-head">
        <span className="fd-modal-dot" style={{ background: priorityColor }} />
        <span className="fd-modal-id">{isNew ? 'New ticket' : draft.id}</span>
        <div className="fd-spacer" />
        <button className="fd-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="fd-modal-body">
        {error && <div className="fd-modal-warning" style={{ color: '#d4493f', background: 'rgba(212,73,63,0.1)' }}>{error}</div>}
        {warning && <div className="fd-modal-warning">{warning}</div>}

        <div className="fd-field">
          <label className="fd-field-label">Title</label>
          <input className="fd-field-input" value={draft.title} onChange={(e) => setDraftField('title', e.target.value)} />
        </div>

        <div className="fd-field">
          <label className="fd-field-label">Description</label>
          <textarea
            className="fd-field-textarea"
            value={draft.description || ''}
            onChange={(e) => setDraftField('description', e.target.value)}
            placeholder="Add a description…"
          />
        </div>

        <div className="fd-field-grid">
          <div className="fd-field">
            <label className="fd-field-label">Owner</label>
            <select
              className="fd-field-select"
              value={draft.owner || ''}
              onChange={(e) => {
                const eng = engineers.find((x) => x.name === e.target.value);
                setDraftField('owner', e.target.value);
                setDraftField('ownerKey', eng ? eng.key : null);
              }}
            >
              <option value="">Unassigned</option>
              {engineers.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
            </select>
          </div>
          <div className="fd-field">
            <label className="fd-field-label">Squad</label>
            <select className="fd-field-select" value={draft.squad || ''} onChange={(e) => setDraftField('squad', e.target.value)}>
              {squads.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="fd-field">
            <label className="fd-field-label">Status</label>
            <select className="fd-field-select" value={draft.status || ''} onChange={(e) => setDraftField('status', e.target.value)} disabled={isNew}>
              {statuses.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            {isNew && <span style={{ fontSize: 11, color: 'var(--faint)' }}>Set by Jira's workflow on create</span>}
          </div>
          <div className="fd-field">
            <label className="fd-field-label">Priority</label>
            <select className="fd-field-select" value={draft.priority || ''} onChange={(e) => setDraftField('priority', e.target.value)}>
              {priorities.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="fd-field">
            <label className="fd-field-label">Due date</label>
            <input type="date" className="fd-field-date" value={draft.due || ''} onChange={(e) => setDraftField('due', e.target.value)} />
          </div>
          <div className="fd-field">
            <label className="fd-field-label">Labels (comma-separated)</label>
            <input
              className="fd-field-text"
              value={(draft.labels || []).join(', ')}
              onChange={(e) => setDraftField('labels', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              placeholder="bug, ui"
            />
          </div>
        </div>
      </div>

      <div className="fd-modal-footer">
        {!isNew && <button className="fd-delete-btn" onClick={onDelete} disabled={saving}>Delete</button>}
        <div className="fd-spacer" />
        <button className="fd-cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="fd-save-btn" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div className="fd-modal-overlay" style={{ background: 'var(--overlay, rgba(20,28,46,0.42))' }} onClick={onClose}>
      <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
