import { css } from '@reference-ui/react'

const n = 4
const gap = '8px'
const tokens = { space: 2, unit: 'px' }

// SPEC-V2-11: numeric arithmetic over literals, const idents, and members.
export const a = css({ order: 2 + 3 })
export const b = css({ order: n * 2 })
export const c = css({ order: '5' - 1 })
export const d = css({ order: true * 4 })
export const e = css({ order: 7 % 3 })
export const f = css({ order: tokens.space * 3 })
export const g = css({ order: (2 + 3) * 2 })
export const h = css({ order: 2 ** 3 })

// SPEC-V2-10: string concat with a string side, any operand order.
export const i = css({ width: 1 + 'px' })
export const j = css({ width: n + 'px' })
export const k = css({ width: '50' + '%' })
export const l = css({ width: tokens.space + tokens.unit })
export const m = css({ border: gap + ' solid' })
