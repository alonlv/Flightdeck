import * as ticketService from '../ticketService.js';

// Tools the assistant can call - each one is just a thin wrapper over the same
// ticketService functions the REST routes use, so every tool call goes through
// the exact same Jira auth (Kerberos/token) already configured for the app.
// No separate credentials, no direct Jira access from the LLM.

function summarize(t) {
  return {
    id: t.id, title: t.title, status: t.status, owner: t.owner, priority: t.priority,
    squad: t.squad, due: t.due, blocked: t.blocked, overdue: t.overdue, labels: t.labels,
  };
}

const tools = [
  {
    name: 'list_tickets',
    description: 'List tickets currently in scope, optionally filtered. Use before answering questions about the board or to find a ticket id by title/owner.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Exact status name to filter by' },
        owner: { type: 'string', description: 'Owner display name (substring match)' },
        squad: { type: 'string' },
        blocked: { type: 'boolean' },
        overdue: { type: 'boolean' },
        search: { type: 'string', description: 'Case-insensitive substring match against the title' },
      },
    },
    mutates: false,
    async execute(args = {}) {
      const { tickets } = await ticketService.listTickets();
      let out = tickets;
      if (args.status) out = out.filter((t) => t.status.toLowerCase() === args.status.toLowerCase());
      if (args.owner) out = out.filter((t) => (t.owner || '').toLowerCase().includes(args.owner.toLowerCase()));
      if (args.squad) out = out.filter((t) => (t.squad || '').toLowerCase() === args.squad.toLowerCase());
      if (args.blocked) out = out.filter((t) => t.blocked);
      if (args.overdue) out = out.filter((t) => t.overdue);
      if (args.search) out = out.filter((t) => t.title.toLowerCase().includes(args.search.toLowerCase()));
      return out.slice(0, 50).map(summarize);
    },
  },
  {
    name: 'list_engineers',
    description: 'List known engineers (display name + Jira account key). Use this to resolve an owner name to the ownerKey needed by create_ticket/update_ticket before assigning someone.',
    parameters: { type: 'object', properties: {} },
    mutates: false,
    async execute() {
      const { meta } = await ticketService.listTickets();
      return meta.engineers;
    },
  },
  {
    name: 'get_ticket',
    description: 'Fetch full details (including the description) for a single ticket by id.',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    mutates: false,
    async execute({ id }) {
      return await ticketService.getTicket(id);
    },
  },
  {
    name: 'create_ticket',
    description: 'Create a new ticket in Jira.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        ownerKey: { type: 'string', description: 'Jira account key from list_engineers, not a display name' },
        squad: { type: 'string' },
        priority: { type: 'string' },
        due: { type: 'string', description: 'YYYY-MM-DD' },
        labels: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
    mutates: true,
    async execute(args) {
      return summarize(await ticketService.createTicket(args));
    },
  },
  {
    name: 'update_ticket',
    description: 'Update fields and/or transition the status on an existing ticket. Only pass the fields being changed.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        ownerKey: { type: 'string', description: 'Jira account key from list_engineers, not a display name' },
        squad: { type: 'string' },
        priority: { type: 'string' },
        due: { type: 'string', description: 'YYYY-MM-DD' },
        labels: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', description: 'Target status name - must be reachable from the current status via a workflow transition' },
      },
      required: ['id'],
    },
    mutates: true,
    async execute({ id, ...patch }) {
      const { ticket, warnings } = await ticketService.updateTicket(id, patch);
      return { ticket: summarize(ticket), warnings };
    },
  },
  {
    name: 'delete_ticket',
    description: 'Permanently delete a ticket from Jira. Destructive - only call this if the user clearly named the specific ticket id to delete.',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    mutates: true,
    async execute({ id }) {
      await ticketService.deleteTicket(id);
      return { deleted: id };
    },
  },
];

export function toOllamaTools() {
  return tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
}

export async function executeTool(name, args) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const result = await tool.execute(args || {});
  return { result, mutates: tool.mutates };
}
