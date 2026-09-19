import { css } from '@reference-ui/react'

// Overlapping inline-object spreads: both atoms mint, the runtime merge
// resolves the shared slot to the last spread (v2 `calls.rs:1736` twin).
export const a = css({ ...{ color: 'red' }, ...{ color: 'blue' } })
