// Baseline css() for the CORE-WATCH-31 world: one utility the sheet always carries. The include names this file
// exactly, and the spec rewrites it under a live watch, then restores it before and after every run.

import { css } from '@reference-ui/react'

export const base = css({ zIndex: 3101 })
