import { css } from '@reference-ui/react'

// SPEC-V2-35: a plain reassignment drops the binding (never the stale init).
let color = 'red'
color = 'blue'
export const a = css({ color })

// Compound assignment is a write too.
let count = 1
count += 1
export const b = css({ order: count })

// Update expressions (`++`/`--`) are writes.
let bump = 2
bump++
export const c = css({ order: bump })

// A member write poisons the root binding.
let theme = { primary: 'red' }
theme.primary = 'blue'
export const d = css({ color: theme.primary })

// A for-of head over an existing binding is a write.
let picked = 'red'
for (picked of ['blue']) {
}
export const e = css({ color: picked })

// A mutated object spread keeps its siblings and names the write.
let palette = { color: 'red' }
palette.color = 'blue'
export const f = css({ ...palette, padding: '4px' })
