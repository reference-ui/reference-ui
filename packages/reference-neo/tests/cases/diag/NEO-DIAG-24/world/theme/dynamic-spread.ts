import { css } from '@reference-ui/react'

export function spreadIt(overrides: Record<string, string>): string {
  return css({ color: 'brand', ...overrides })
}
