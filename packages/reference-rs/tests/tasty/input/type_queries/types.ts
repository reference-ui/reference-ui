/**
 * Type-query scenario: typeof on local values and qualified expressions.
 * Used to verify structural TypeRef emission for TS type queries.
 */

const themeConfig = {
  colors: {
    primary: '#00f',
  },
}

const tokens = {
  spacing: {
    sm: 4,
    lg: 16,
  },
}

/** Type query alias using a local identifier. */
export type ThemeConfig = typeof themeConfig

/** Type query alias using a qualified expression. */
export type SpacingScale = typeof tokens.spacing

/** Interface members that use type queries directly. */
export interface WithTypeQueries {
  config: typeof themeConfig
  spacing: typeof tokens.spacing
}
