// @warp-tools/ui — Shared design system
// Components added as systems are built. See specs/ for what's needed.

export const colors = {
  background: '#040810',
  card: '#080F1E',
  cardHover: '#0C1528',
  accent: '#00C650',
  accentMuted: '#00C65020',
  text: '#FFFFFF',
  textMuted: '#8B95A5',
  border: '#1A2235',
  danger: '#FF4444',
  warning: '#FFAA00',
  warningMuted: '#FFAA0020',
  dangerMuted: '#FF444420',
  success: '#00C650',
} as const;

export type WarpColors = typeof colors;

// Status colors for compliance and system states
export const statusColors = {
  active: colors.success,
  expiringSoon: colors.warning,
  expired: colors.danger,
  inactive: colors.textMuted,
} as const;
