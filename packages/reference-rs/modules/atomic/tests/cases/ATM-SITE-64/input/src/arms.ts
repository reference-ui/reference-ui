import { css } from '@reference-ui/react'

declare const flag: boolean
declare const ok: boolean

// Equal branches collapse to a single class.
export const a = css({ color: flag ? 'red' : 'red' })
// Mixed-type arms both compile; the runtime picks.
export const b = css({ margin: ok ? '4px' : 8 })
// Per-arm important: only the flagged arm carries it.
export const c = css({ padding: flag ? '2r!' : '3r' })
