// Minimal fixture for ATM-W-DYNAMIC-IDENTIFIER in the CORE-DIAG-23 world.
// It takes a caller-supplied color string at runtime and feeds it to css()
// as the color leaf. The parameter is unknowable statically, so compiling
// the world must surface the code as a warning with a non-blank message.
import { css } from '@reference-ui/react'

export function tint(themeColor: string): string {
  return css({ color: themeColor })
}
