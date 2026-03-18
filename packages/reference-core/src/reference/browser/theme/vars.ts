export interface ReferenceThemeTokenDefinition {
  variable: `--reference-${string}`
  fallback: string
}

export const referenceTheme = {
  color: {
    foreground: {
      variable: '--reference-color-foreground',
      fallback: '#000000',
    },
    muted: {
      variable: '--reference-color-muted',
      fallback: '#5f5f5f',
    },
    border: {
      variable: '--reference-color-border',
      fallback: '#000000',
    },
    background: {
      variable: '--reference-color-background',
      fallback: '#ffffff',
    },
    subtleBackground: {
      variable: '--reference-color-subtle-background',
      fallback: '#f6f6f6',
    },
  },
  space: {
    xxs: {
      variable: '--reference-space-xxs',
      fallback: '0.125rem',
    },
    xs: {
      variable: '--reference-space-xs',
      fallback: '0.25rem',
    },
    sm: {
      variable: '--reference-space-sm',
      fallback: '0.5rem',
    },
    md: {
      variable: '--reference-space-md',
      fallback: '0.75rem',
    },
    lg: {
      variable: '--reference-space-lg',
      fallback: '1rem',
    },
  },
  font: {
    mono: {
      variable: '--reference-font-mono',
      fallback: 'monospace',
    },
  },
} as const

export const referenceThemeVarDefaults = {
  [referenceTheme.color.foreground.variable]: referenceTheme.color.foreground.fallback,
  [referenceTheme.color.muted.variable]: referenceTheme.color.muted.fallback,
  [referenceTheme.color.border.variable]: referenceTheme.color.border.fallback,
  [referenceTheme.color.background.variable]: referenceTheme.color.background.fallback,
  [referenceTheme.color.subtleBackground.variable]: referenceTheme.color.subtleBackground.fallback,
  [referenceTheme.space.xxs.variable]: referenceTheme.space.xxs.fallback,
  [referenceTheme.space.xs.variable]: referenceTheme.space.xs.fallback,
  [referenceTheme.space.sm.variable]: referenceTheme.space.sm.fallback,
  [referenceTheme.space.md.variable]: referenceTheme.space.md.fallback,
  [referenceTheme.space.lg.variable]: referenceTheme.space.lg.fallback,
  [referenceTheme.font.mono.variable]: referenceTheme.font.mono.fallback,
} as const
