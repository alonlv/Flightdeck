import express from 'express';
import { ollamaChat, OllamaError } from '../llm/ollamaClient.js';
import { toOllamaTools, executeTool } from '../llm/tools.js';

export const router = express.Router();

const MAX_TOOL_ROUNDS = 6;

function systemPrompt() {
  return [
    "You are Flightdeck's assistant, embedded in an engineering manager's live Jira board.",
    `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
    'You have tools to read and modify real Jira tickets. Use them whenever a question needs live data, ' +
      'or the user asks you to create, update, transition, or delete a ticket - never guess ticket data.',
    'Resolve an owner name to an ownerKey via list_engineers before calling create_ticket/update_ticket with an owner.',
    'Be concise. After acting, briefly confirm what changed, including the ticket id.',
    'delete_ticket is destructive - only call it when the user clearly names the specific ticket id to delete.',
  ].join('\n');
}

router.post('/chat', async (req, res, next) => {
  try {
    const { message, history } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });

    const messages = [
      { role: 'system', content: systemPrompt() },
      ...(Array.isArray(history) ? history.slice(-12) : []),
      { role: 'user', content: message },
    ];

    const tools = toOllamaTools();
    let mutated = false;
    let lastMessage = null;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await ollamaChat({ messages, tools });
      const msg = data.message || { role: 'assistant', content: '' };
      messages.push(msg);
      lastMessage = msg;

      if (!msg.tool_calls || !msg.tool_calls.length) break;

      for (const call of msg.tool_calls) {
        const name = call.function?.name;
        let args = call.function?.arguments;
        if (typeof args === 'string') {
          try {
            args = JSON.parse(args);
          } catch {
            args = {};
          }
        }
        let toolResult;
        try {
          const { result, mutates } = await executeTool(name, args);
          if (mutates) mutated = true;
          toolResult = result;
        } catch (err) {
          toolResult = { error: err.message };
        }
        messages.push({ role: 'tool', content: JSON.stringify(toolResult) });
      }
    }

    res.json({ reply: lastMessage?.content || "I wasn't able to come up with a reply.", mutated });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof OllamaError) {
    return res.status(503).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: err.message || 'Unexpected server error' });
});
