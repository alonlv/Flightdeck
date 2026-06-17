import { useEffect, useRef } from 'react';
import { ChatIcon, SendIcon } from './Icons.jsx';

const SUGGESTIONS = ["What's blocked?", "Who's overloaded?", 'Standup summary'];

export default function ChatPanel({ messages, input, setInput, onSend, onToggle }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <aside className="fd-chat">
      <div className="fd-chat-head">
        <span className="fd-chat-icon"><ChatIcon /></span>
        <div>
          <div className="fd-chat-title">Assistant</div>
          <div className="fd-chat-sub">Reads your live board</div>
        </div>
        <div className="fd-spacer" />
        <button className="fd-chat-close" onClick={onToggle}>×</button>
      </div>

      <div className="fd-chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`fd-msg ${m.from === 'user' ? 'user' : 'bot'}`}>{m.text}</div>
        ))}
      </div>

      <div className="fd-chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="fd-suggestion-btn" onClick={() => onSend(s)}>{s}</button>
        ))}
      </div>

      <div className="fd-chat-input-row">
        <input
          className="fd-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSend(); } }}
          placeholder="Ask or create a ticket…"
        />
        <button className="fd-chat-send" onClick={() => onSend()}>
          <SendIcon />
        </button>
      </div>
    </aside>
  );
}
