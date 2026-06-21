import { useEffect, useRef, useState } from 'react';
import { SlidersIcon } from './Icons.jsx';
import { advancedFiltersCount } from '../utils.js';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default (recently updated in Jira)' },
  { value: 'priority', label: 'Priority, highest first' },
  { value: 'due', label: 'Due date, soonest first' },
  { value: 'updated', label: 'Recently updated' },
];

export default function AdvancedFilters({ filters, setFilterMany, clearAdvancedFilters, allLabels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = advancedFiltersCount(filters);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const toggleLabel = (label) => {
    const has = filters.labelsAll.includes(label);
    setFilterMany({ labelsAll: has ? filters.labelsAll.filter((l) => l !== label) : [...filters.labelsAll, label] });
  };

  return (
    <div className="fd-adv-wrap" ref={ref}>
      <button
        className={`fd-icon-btn fd-adv-toggle ${count ? 'active' : ''}`}
        title="More filters"
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersIcon />
        {count > 0 && <span className="fd-adv-badge">{count}</span>}
      </button>

      {open && (
        <div className="fd-adv-panel" onClick={(e) => e.stopPropagation()}>
          <div className="fd-adv-panel-head">
            <span>More filters</span>
            {count > 0 && <button className="fd-clear-btn" onClick={clearAdvancedFilters}>Reset</button>}
          </div>

          <div className="fd-adv-section">
            <label className="fd-adv-check">
              <input type="checkbox" checked={filters.blockedOnly} onChange={(e) => setFilterMany({ blockedOnly: e.target.checked })} />
              Blocked only
            </label>
            <label className="fd-adv-check">
              <input type="checkbox" checked={filters.overdueOnly} onChange={(e) => setFilterMany({ overdueOnly: e.target.checked })} />
              Overdue only
            </label>
            <label className="fd-adv-check">
              <input type="checkbox" checked={filters.unassignedOnly} onChange={(e) => setFilterMany({ unassignedOnly: e.target.checked })} />
              Unassigned only
            </label>
            <label className="fd-adv-check">
              <input type="checkbox" checked={filters.searchInDescription} onChange={(e) => setFilterMany({ searchInDescription: e.target.checked })} />
              Search also matches description
            </label>
          </div>

          <div className="fd-adv-section">
            <div className="fd-adv-label">Due date</div>
            <div className="fd-adv-daterow">
              <input
                type="date" className="fd-adv-date" value={filters.dueAfter}
                onChange={(e) => setFilterMany({ dueAfter: e.target.value })} title="Due on/after"
              />
              <span className="fd-adv-date-sep">→</span>
              <input
                type="date" className="fd-adv-date" value={filters.dueBefore}
                onChange={(e) => setFilterMany({ dueBefore: e.target.value })} title="Due on/before"
              />
            </div>
          </div>

          {allLabels.length > 0 && (
            <div className="fd-adv-section">
              <div className="fd-adv-label">Labels (must have all selected)</div>
              <div className="fd-adv-chips">
                {allLabels.map((l) => (
                  <button
                    key={l}
                    className={`fd-adv-chip ${filters.labelsAll.includes(l) ? 'active' : ''}`}
                    onClick={() => toggleLabel(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fd-adv-section">
            <div className="fd-adv-label">Sort by</div>
            <select className="fd-select fd-adv-sort" value={filters.sortBy} onChange={(e) => setFilterMany({ sortBy: e.target.value })}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
