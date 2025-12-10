// Color theme constants based on PRD Section 6

export const colors = {
  // Background colors
  background: '#0F1419',
  card: '#1A1F29',
  border: '#2D3748',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',

  // Accent colors
  accentBlue: '#3B82F6',
  accentGreen: '#10B981',
  accentYellow: '#F59E0B',
  accentRed: '#EF4444',

  // Heatmap gradient (completion percentage)
  heatmap: {
    0: '#1A1F29',     // 0% - Dark slate
    25: '#1a3a2e',    // 1-25% - Very dark green
    50: '#2d5a3f',    // 26-50% - Medium dark green
    75: '#4a9d6f',    // 51-75% - Medium green
    100: '#059669',   // 76-99% - Bright green
    complete: '#10B981', // 100% - Vibrant green with glow
  },
} as const;

export const spacing = {
  cellPadding: '12px',
  gridGap: '8px',
  modalPadding: '24px',
} as const;

export const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  cellText: {
    desktop: '14px',
    mobile: '12px',
  },
  breadcrumbs: '12px',
  journal: '14px',
} as const;

export const animation = {
  zoomDuration: 500, // ms
  fadeDuration: 200, // ms
  hoverDuration: 150, // ms
  easingFunction: 'ease-in-out',
} as const;

export const dimensions = {
  cellSize: {
    min: 60, // px
    max: 200, // px
  },
  minimap: {
    desktop: 150, // px
    mobile: 100, // px
  },
  minTapTarget: 44, // px (mobile)
} as const;
