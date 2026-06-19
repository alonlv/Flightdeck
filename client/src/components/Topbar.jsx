import { PlusIcon, ChatIcon, SearchIcon, SaveIcon } from './Icons.jsx';
import AdvancedFilters from './AdvancedFilters.jsx';

export default function Topbar({
  view, filteredCount, totalCount, onNewTicket, theme, toggleTheme, chatOpen, toggleChat, onRefresh, refreshing,
  filters, setFilter, setFilterMany, clearFilters, clearAdvancedFilters, dirty, saveCurrentView,
  statusOptions, priorityOptions, ownerOptions, labelOptions, allLabels,
}) {
  return (
    <header className="fd-header">
      <div className="fd-header-top">
        <h1 className="fd-view-title">{view}</h1>
        <span className="fd-counts">{filteredCount} of {totalCount} tickets</span>
        <div className="fd-spacer" />
        <button className="fd-icon-btn" title="Refresh from Jira" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? '…' : '⟳'}
        </button>
        <button className="fd-btn-primary" onClick={onNewTicket}>
          <PlusIcon /> New ticket
        </button>
        <button className="fd-icon-btn" title="Toggle theme" onClick={toggleTheme}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button className="fd-chat-toggle" title="Toggle assistant" onClick={toggleChat}>
          <ChatIcon /> Assistant
        </button>
      </div>

      <div className="fd-filters-row">
        <div className="fd-search-box">
          <SearchIcon />
          <input
            className="fd-search-input"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search tickets…"
          />
        </div>
        <div className="fd-vdivider" />
        <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={statusOptions} />
        <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilter('priority', v)} options={priorityOptions} />
        <FilterSelect label="Owner" value={filters.owner} onChange={(v) => setFilter('owner', v)} options={ownerOptions} wide />
        <FilterSelect label="Label" value={filters.label} onChange={(v) => setFilter('label', v)} options={labelOptions} />
        <AdvancedFilters filters={filters} setFilterMany={setFilterMany} clearAdvancedFilters={clearAdvancedFilters} allLabels={allLabels} />
        <div className="fd-spacer" />
        {dirty && <button className="fd-clear-btn" onClick={clearFilters}>Clear</button>}
        <button className="fd-save-view-btn" onClick={saveCurrentView}>
          <SaveIcon /> Save view
        </button>
      </div>
    </header>
  );
}

function FilterSelect({ label, value, onChange, options, wide }) {
  return (
    <div className="fd-filter-group">
      <span className="fd-filter-label">{label}</span>
      <select className="fd-select" style={wide ? { maxWidth: 150 } : undefined} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
