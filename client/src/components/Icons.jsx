export function LogoMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16">
      <rect x="1.5" y="2" width="3.4" height="12" rx="1.2" fill="#fff" />
      <rect x="6.3" y="2" width="3.4" height="8" rx="1.2" fill="#fff" opacity="0.78" />
      <rect x="11.1" y="2" width="3.4" height="5" rx="1.2" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export function BoardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1" y="2" width="3.6" height="12" rx="1" fill="currentColor" />
      <rect x="6.2" y="2" width="3.6" height="12" rx="1" fill="currentColor" />
      <rect x="11.4" y="2" width="3.6" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1" y="2.5" width="14" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="1" y="6.9" width="14" height="2.2" rx="1.1" fill="currentColor" />
      <rect x="1" y="11.3" width="14" height="2.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

export function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1" y="9" width="3.4" height="5.5" rx="1" fill="currentColor" />
      <rect x="6.3" y="5" width="3.4" height="9.5" rx="1" fill="currentColor" />
      <rect x="11.6" y="2" width="3.4" height="12.5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14">
      <rect x="6" y="1" width="2" height="12" rx="1" fill="#fff" />
      <rect x="1" y="6" width="12" height="2" rx="1" fill="#fff" />
    </svg>
  );
}

export function ChatIcon({ color = '#2a6fdb' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      <path d="M2 3.2C2 2.5 2.6 2 3.3 2h9.4c.7 0 1.3.5 1.3 1.2v6.1c0 .7-.6 1.2-1.3 1.2H6.2L3 13V10.5h-.7c-.2 0-.3-.5-.3-1.2V3.2Z" fill={color} />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <line x1="10.6" y1="10.6" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function SaveIcon({ color = '#2a6fdb' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14">
      <path d="M2.5 1.5h7l2.5 2.5v8a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5Z" fill="none" stroke={color} strokeWidth="1.3" />
      <rect x="4" y="1.5" width="4" height="3.2" rx="0.4" fill={color} />
    </svg>
  );
}

export function SlidersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <circle cx="6" cy="4" r="1.6" fill="currentColor" />
      <circle cx="11" cy="8" r="1.6" fill="currentColor" />
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M2 8 14 3 9 14 7.5 9.2 2 8Z" fill="#fff" />
    </svg>
  );
}
