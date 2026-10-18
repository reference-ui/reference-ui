// Baseline css() for the CORE-WATCH-14 world. It takes the brand token and emits one brand-colored utility.
// The spec saves a new brand value into tokens.ts, and this rule is what repaints the sheet.

import { css } from '@reference-ui/react'

export const base = css({ color: 'brand' })
