import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api } from './api.js';
import { cssVarsFor, DEFAULT_ACCENT } from './theme.js';
import { applyFilters, filtersDirty, sortStatuses, loadJSON, saveJSON, colorForName, EMPTY_FILTERS } from './utils.js';
import { initialsFor } from './clientColors.js';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import BoardView from './components/BoardView.jsx';
import ListView from './components/ListView.jsx';
import DashboardView from './components/DashboardView.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import EditModal from './components/EditModal.jsx';

const EMPTY_META = { engineers: [], squads: [], labels: [], statuses: [], priorities: [] };

export default function App() {
  const [theme, setTheme] = useState(() => loadJSON('fd.theme', 'light'));
  const [view, setView] = useState(() => loadJSON('fd.view', 'Board'));
  const [chatOpen, setChatOpen] = useState(() => loadJSON('fd.chatOpen', true));
  const [savedViews, setSavedViews] = useState(() => loadJSON('fd.savedViews', []));
  const [activeViewId, setActiveViewId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [whoami, setWhoami] = useState(null);

  const [editing, setEditing] = useState(null); // ticket id, 'NEW', or null
  const [draft, setDraft] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalWarning, setModalWarning] = useState(null);
  const [saving, setSaving] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: "Hi! I'm your Flightdeck assistant — I read and act on your live Jira board.\n\nTry: \"What's blocked?\", \"Who's overloaded?\", \"create a ticket for...\", \"move ENG-1 to In Review\", or just ask me to explain a ticket." },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatPending, setChatPending] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => saveJSON('fd.theme', theme), [theme]);
  useEffect(() => saveJSON('fd.view', view), [view]);
  useEffect(() => saveJSON('fd.chatOpen', chatOpen), [chatOpen]);
  useEffect(() => saveJSON('fd.savedViews', savedViews), [savedViews]);

  const refreshTickets = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.getTickets();
      setTickets(data.tickets);
      setMeta(data.meta);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshTickets();
    api.whoami().then((me) => setWhoami({ displayName: me.displayName, initials: initialsFor(me.displayName) })).catch(() => {});
  }, [refreshTickets]);

  const priorityColorMap = useMemo(() => {
    const m = {};
    meta.priorities.forEach((p) => { m[p.name] = p.color; });
    return m;
  }, [meta.priorities]);

  const enriched = useMemo(
    () => tickets.map((t) => ({ ...t, priorityColor: priorityColorMap[t.priority] || '#8a94a6' })),
    [tickets, priorityColorMap]
  );

  const filtered = useMemo(() => applyFilters(enriched, filters), [enriched, filters]);
  const statuses = useMemo(() => sortStatuses(meta.statuses), [meta.statuses]);
  const dirty = filtersDirty(filters);

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setActiveViewId(null); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setActiveViewId(null); };
  const setSquad = (val) => setFilter('squad', val);

  const applyView = (v) => { setFilters({ ...EMPTY_FILTERS, ...v.filters }); setActiveViewId(v.id); };
  const saveCurrentView = () => {
    const name = window.prompt('Name this saved view:', '');
    if (!name) return;
    const id = 'v' + Date.now();
    setSavedViews((vs) => [...vs, { id, name, filters: { ...filters } }]);
    setActiveViewId(id);
  };

  const squadCounts = useMemo(() => {
    const out = {};
    meta.squads.forEach((s) => {
      out[s] = { count: enriched.filter((t) => t.squad === s).length, dot: colorForName(s) };
    });
    return out;
  }, [meta.squads, enriched]);

  const savedViewsWithCounts = useMemo(
    () => savedViews.map((v) => ({ ...v, count: applyFilters(enriched, { ...EMPTY_FILTERS, ...v.filters }).length })),
    [savedViews, enriched]
  );

  // ---- ticket editing ----
  const openTicket = async (id) => {
    setEditing(id);
    setModalLoading(true);
    setModalError(null);
    setModalWarning(null);
    try {
      const t = await api.getTicket(id);
      setDraft({ ...t, priorityColor: priorityColorMap[t.priority] });
    } catch (err) {
      const fallback = enriched.find((t) => t.id === id);
      if (fallback) setDraft({ ...fallback });
      else setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const newTicket = () => {
    const squad = filters.squad !== 'All' ? filters.squad : meta.squads[0] || '';
    setEditing('NEW');
    setModalError(null);
    setModalWarning(null);
    setDraft({
      title: '', description: '', owner: '', ownerKey: null, squad,
      status: statuses[0]?.name || '', priority: meta.priorities[0]?.name || '', due: '', labels: [],
    });
  };

  const closeModal = () => { setEditing(null); setDraft(null); setModalError(null); setModalWarning(null); };
  const setDraftField = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const saveTicket = async () => {
    if (!draft) return;
    setSaving(true);
    setModalError(null);
    try {
      if (editing === 'NEW') {
        const created = await api.createTicket(draft);
        setTickets((ts) => [created, ...ts]);
      } else {
        const { ticket, warnings } = await api.updateTicket(editing, draft);
        setTickets((ts) => ts.map((t) => (t.id === ticket.id ? ticket : t)));
        if (warnings && warnings.length) {
          setModalWarning(warnings.join(' '));
          setSaving(false);
          return; // let the user see the warning before the modal closes
        }
      }
      closeModal();
      refreshTickets();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTicket = async () => {
    if (editing === 'NEW' || !editing) return;
    if (!window.confirm(`Delete ${editing} from Jira? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api.deleteTicket(editing);
      setTickets((ts) => ts.filter((t) => t.id !== editing));
      closeModal();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const moveTicket = async (id, status) => {
    const prev = tickets;
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const { ticket, warnings } = await api.updateTicket(id, { status });
      setTickets((ts) => ts.map((t) => (t.id === id ? ticket : t)));
      if (warnings && warnings.length) setLoadError(warnings.join(' '));
    } catch (err) {
      setTickets(prev);
      setLoadError(err.message);
    }
  };

  const onDrop = (status) => {
    const id = dragRef.current;
    dragRef.current = null;
    if (id) moveTicket(id, status);
  };

  // ---- chat ----
  const listStr = (arr) => {
    if (!arr.length) return 'none';
    const lines = arr.slice(0, 6).map((t) => `• ${t.id} — ${t.title} (${(t.owner || '').split(' ')[0]})`);
    if (arr.length > 6) lines.push(`…and ${arr.length - 6} more`);
    return lines.join('\n');
  };

  const botReply = (text) => {
    const q = text.toLowerCase();
    const all = enriched;
    const blocked = all.filter((t) => t.blocked);
    const overdue = all.filter((t) => t.overdue);
    const open = all.filter((t) => t.statusCategory !== 'done');
    if (/block/.test(q)) return blocked.length ? `${blocked.length} blocked ticket${blocked.length > 1 ? 's' : ''}:\n${listStr(blocked)}` : 'Nothing is blocked right now.';
    if (/(overdue|late|past due)/.test(q)) return overdue.length ? `${overdue.length} overdue ticket${overdue.length > 1 ? 's' : ''}:\n${listStr(overdue)}` : 'No overdue tickets — you are on track.';
    if (/(workload|overload|busy|capacity|load)/.test(q)) {
      const by = {};
      open.forEach((t) => { by[t.owner] = (by[t.owner] || 0) + 1; });
      const rows = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => `• ${(n || '').split(' ')[0]} — ${c} open`);
      return `Open workload (most loaded first):\n${rows.join('\n')}`;
    }
    if (/urgent/.test(q)) {
      const topPriority = meta.priorities[0]?.name;
      const u = open.filter((t) => t.priority === topPriority);
      return u.length ? `${u.length} ${topPriority} open:\n${listStr(u)}` : `No ${topPriority || 'urgent'} open tickets.`;
    }
    if (/(summary|standup|status report|overview|how are we|where are we)/.test(q)) {
      const counts = statuses.map((s) => `${s.name}: ${all.filter((t) => t.status === s.name).length}`).join('  ·  ');
      return `Standup summary (${all.length} tickets)\n${counts}\n\n⚠ ${blocked.length} blocked, ${overdue.length} overdue.\nTop need: ${blocked[0] ? blocked[0].id + ' ' + blocked[0].title : '—'}`;
    }
    return "I can read your board. Try:\n• \"What's blocked?\"\n• \"Who's overloaded?\"\n• \"Show overdue\"\n• \"Standup summary\"\n• \"create: Fix login redirect\"";
  };

  // Tries the local LLM assistant (Ollama + Gemma, full Jira read/write via tool-calling)
  // first; if it's not running, falls back to the canned regex-based replies below so
  // the chat panel still works with zero extra setup.
  const sendChat = async (preset) => {
    const text = (preset !== undefined ? preset : chatInput).trim();
    if (!text) return;
    const history = chatMessages.slice(-12).map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
    setChatMessages((m) => [...m, { from: 'user', text }]);
    setChatInput('');
    setChatPending(true);
    try {
      const { reply, mutated } = await api.chat(text, history);
      setChatMessages((msgs) => [...msgs, { from: 'bot', text: reply }]);
      if (mutated) refreshTickets();
      return;
    } catch {
      // Local LLM unavailable - fall through to the built-in assistant below.
    } finally {
      setChatPending(false);
    }

    const m = text.match(/^(create|add|new)\s*[:\-]?\s+(.+)$/i);
    if (m && m[2]) {
      const title = m[2].trim();
      try {
        const squad = filters.squad !== 'All' ? filters.squad : meta.squads[0] || '';
        const created = await api.createTicket({ title, squad, labels: [] });
        setTickets((ts) => [created, ...ts]);
        setChatMessages((msgs) => [...msgs, { from: 'bot', text: `✓ Created ${created.id} — "${title}". Click it to edit, or drag it on the board.` }]);
      } catch (err) {
        setChatMessages((msgs) => [...msgs, { from: 'bot', text: `Couldn't create that ticket in Jira: ${err.message}` }]);
      }
      return;
    }
    setChatMessages((msgs) => [...msgs, { from: 'bot', text: botReply(text) }]);
  };

  const appStyle = cssVarsFor(theme, DEFAULT_ACCENT);

  if (loading) {
    return (
      <div className="fd-app" style={appStyle}>
        <div className="fd-center-state" style={{ width: '100%' }}>Loading your board from Jira…</div>
      </div>
    );
  }

  return (
    <div className="fd-app" style={appStyle}>
      <Sidebar
        view={view} setView={setView}
        savedViews={savedViewsWithCounts} activeViewId={activeViewId} applyView={applyView}
        squads={meta.squads} filters={filters} setSquad={setSquad}
        allCount={enriched.length} squadCounts={squadCounts}
        whoami={whoami}
      />

      <div className="fd-main">
        <Topbar
          view={view} filteredCount={filtered.length} totalCount={enriched.length}
          onNewTicket={newTicket} theme={theme} toggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          chatOpen={chatOpen} toggleChat={() => setChatOpen((c) => !c)}
          onRefresh={refreshTickets} refreshing={refreshing}
          filters={filters} setFilter={setFilter} clearFilters={clearFilters} dirty={dirty}
          saveCurrentView={saveCurrentView}
          statusOptions={['All', ...statuses.map((s) => s.name)]}
          priorityOptions={['All', ...meta.priorities.map((p) => p.name)]}
          ownerOptions={['All', ...meta.engineers.map((e) => e.name)]}
          labelOptions={['All', ...meta.labels]}
        />

        {loadError && <div className="fd-error-banner">{loadError}</div>}

        <div className="fd-content">
          {view === 'Board' && <BoardView statuses={statuses} filtered={filtered} onOpen={openTicket} onDrop={onDrop} dragRef={dragRef} />}
          {view === 'List' && <ListView tickets={filtered} onOpen={openTicket} theme={theme} />}
          {view === 'Dashboard' && <DashboardView filtered={filtered} statuses={statuses} onOpen={openTicket} theme={theme} />}
        </div>
      </div>

      {chatOpen && (
        <ChatPanel messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={sendChat} onToggle={() => setChatOpen(false)} pending={chatPending} />
      )}

      {editing && (
        <EditModal
          draft={draft} setDraftField={setDraftField} onClose={closeModal} onSave={saveTicket} onDelete={deleteTicket}
          saving={saving} loading={modalLoading} error={modalError} warning={modalWarning}
          engineers={meta.engineers} squads={meta.squads.length ? meta.squads : [draft?.squad].filter(Boolean)}
          statuses={statuses.length ? statuses : [{ name: draft?.status || '' }]}
          priorities={meta.priorities.length ? meta.priorities : [{ name: draft?.priority || '', color: '#8a94a6' }]}
          isNew={editing === 'NEW'}
        />
      )}
    </div>
  );
}
