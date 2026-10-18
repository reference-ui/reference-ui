// Baseline css() for the CORE-WATCH-15 world. It takes the brand token and emits one brand-colored utility.
// The sheet always carries this rule, so a boot that reads the saved brand shows up in the generated sheet.

import { css } from '@reference-ui/react'

export const base = css({ color: 'brand' })
