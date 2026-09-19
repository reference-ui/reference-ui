import { css } from '@reference-ui/react'

// SPEC-V2-12: comparisons fold to bools; ternary tests prove the value
// without bool-value noise, direct pins prove the leaf itself.
export const a = css({ color: (1 === 1 ? 'red' : 'blue') })
export const b = css({ color: (1 === '1' ? 'red' : 'blue') })
export const c = css({ color: (1 == '1' ? 'red' : 'blue') })
export const d = css({ color: (null == 'x' ? 'red' : 'blue') })
export const e = css({ color: ('a' < 'b' ? 'red' : 'blue') })
export const f = css({ color: (3 >= 5 ? 'red' : 'blue') })
export const g = css({ zIndex: 2 > 1 })
export const h = css({ zIndex: 1 != 1 })
