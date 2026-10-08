import { css } from '@reference-ui/react'

// Pool bait no site reads: a spacing var, a token-shaped oklch value, an
// unlicensed named color, and the one allowlisted word.
const bait = [
  'var(--spacing-4r, 16px)',
  'oklch(55.4% 0.046 257.417)',
  'red',
  'inherit',
]

export function paint(color: string, size: string) {
  return css({ color, width: size })
}
