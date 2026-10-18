// Baseline css() for the CORE-WATCH-13 world. It takes the brand token and emits one brand-colored utility.
// The sheet always carries this rule, so the first sync has a rule to paint before the spec saves anything.

import { css } from '@reference-ui/react'

export const base = css({ color: 'brand' })
