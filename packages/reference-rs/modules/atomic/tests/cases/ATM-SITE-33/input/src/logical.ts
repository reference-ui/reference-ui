import { css } from '@reference-ui/react'

// SPEC-V2-19: all-literal short-circuit folds to the picked operand only.
export const a = css({ color: 'x' && 'red' })
export const b = css({ order: 0 && 9 })
export const c = css({ color: 'red' || 'second' })
export const d = css({ color: '' || 'blue' })
export const e = css({ color: null ?? 'black' })
export const f = css({ color: 'red' ?? 'unused' })
export const g = css({ color: undefined ?? 'teal' })
