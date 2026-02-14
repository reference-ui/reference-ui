import type { SystemStyleObject } from '@pandacss/dev'

/**
 * Base typography styles shared across all text-related primitives.
 * Spread this into recipe base styles to ensure consistent typography.
 * 
 * Default sans typography: Inter with tight letter spacing.
 * Override with font="serif" or font="mono" at runtime.
 */
export const baseTypography: SystemStyleObject = {
  fontFamily: 'sans',
  letterSpacing: '-0.01em',
}
