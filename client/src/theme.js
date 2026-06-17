export const THEMES = {
  light: {
    bg: '#f6f7f9', panel: '#ffffff', panel2: '#f4f5f8', panelHover: '#fafbfc',
    border: '#eaecf1', border2: '#e3e6ec', chip: '#eef0f3', track: '#eef0f3',
    ink: '#1c2330', muted: '#5b6478', faint: '#9aa2b2', avatarChip: '#1c2330',
    overlay: 'rgba(20,28,46,0.42)',
  },
  dark: {
    bg: '#15171c', panel: '#1c1f26', panel2: '#23262e', panelHover: '#23262e',
    border: '#2c3039', border2: '#363b46', chip: '#2a2e37', track: '#2a2e37',
    ink: '#e7e9ef', muted: '#aab2c0', faint: '#79808f', avatarChip: '#3a3f4b',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export const DEFAULT_ACCENT = '#2a6fdb';

export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function cssVarsFor(theme, accent) {
  const t = THEMES[theme] || THEMES.light;
  return {
    '--bg': t.bg, '--panel': t.panel, '--panel2': t.panel2, '--panelHover': t.panelHover,
    '--border': t.border, '--border2': t.border2, '--chip': t.chip, '--track': t.track,
    '--ink': t.ink, '--muted': t.muted, '--faint': t.faint, '--avatarChip': t.avatarChip,
    '--accent': accent, '--accentSoft': hexToRgba(accent, 0.1), '--overlay': t.overlay,
    color: t.ink, background: t.bg,
  };
}
