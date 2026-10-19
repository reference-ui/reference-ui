// Minimal fixture for ATM-W-UNFOLDABLE-SPREAD in the CORE-DIAG-24 world.
// It takes a caller-supplied overrides record at runtime and spreads it into
// css() beside a static color. The parameter is unknowable statically, so
// compiling the world must surface the code as a warning with a non-blank
// message.
import { css } from '@reference-ui/react'

export function spreadIt(overrides: Record<string, string>): string {
  return css({ color: 'brand', ...overrides })
}
