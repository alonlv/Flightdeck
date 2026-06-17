import { config } from '../config.js';

export class OllamaError extends Error {}

// Talks to a local Ollama daemon (https://ollama.com) - no API key, no cloud call.
// Run `ollama pull <model>` once, then `ollama serve` (or it's already running as a
// service); this just hits its OpenAI-style /api/chat endpoint over localhost.
export async function ollamaChat({ messages, tools }) {
  let res;
  try {
    res = await fetch(`${config.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.ollamaModel, messages, tools, stream: false }),
    });
  } catch (err) {
    throw new OllamaError(
      `Couldn't reach Ollama at ${config.ollamaHost}. Is it running? (Install: https://ollama.com, ` +
        `then \`ollama pull ${config.ollamaModel}\` and \`ollama serve\`.) Underlying error: ${err.message}`
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OllamaError(`Ollama returned HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}
