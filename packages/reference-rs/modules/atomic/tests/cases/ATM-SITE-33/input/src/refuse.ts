import { css } from '@reference-ui/react'

declare function pick(): number
declare const maybe: boolean

// Refusals diagnose with a code and keep every static sibling.
export const a = css({ order: 1 / 0, margin: '1r' })
export const b = css({ order: 'foo' - 1, margin: '2r' })
export const c = css({ order: pick() + 1, margin: '3r' })
export const d = css({ order: 5 | 3, margin: '4r' })
export const e = css({ order: 0 / 0, margin: '5r' })
export const f = css({ color: maybe ? 'coral' : 'navy', margin: '6r' })
