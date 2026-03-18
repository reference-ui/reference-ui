import { referenceTheme, type ReferenceThemeTokenDefinition } from './vars'

export function token(definition: ReferenceThemeTokenDefinition): string {
  return `var(${definition.variable}, ${definition.fallback})`
}

export const referenceTokens = {
  color: {
    foreground: token(referenceTheme.color.foreground),
    muted: token(referenceTheme.color.muted),
    border: token(referenceTheme.color.border),
    background: token(referenceTheme.color.background),
    subtleBackground: token(referenceTheme.color.subtleBackground),
  },
  space: {
    xxs: token(referenceTheme.space.xxs),
    xs: token(referenceTheme.space.xs),
    sm: token(referenceTheme.space.sm),
    md: token(referenceTheme.space.md),
    lg: token(referenceTheme.space.lg),
  },
  font: {
    mono: token(referenceTheme.font.mono),
  },
} as const
