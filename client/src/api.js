async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (HTTP ${res.status})`);
  }
  return data;
}

export const api = {
  getTickets: () => request('GET', '/tickets'),
  getTicket: (id) => request('GET', `/tickets/${encodeURIComponent(id)}`),
  createTicket: (draft) => request('POST', '/tickets', draft),
  updateTicket: (id, patch) => request('PATCH', `/tickets/${encodeURIComponent(id)}`, patch),
  deleteTicket: (id) => request('DELETE', `/tickets/${encodeURIComponent(id)}`),
  whoami: () => request('GET', '/whoami'),
  chat: (message, history) => request('POST', '/chat', { message, history }),
};
