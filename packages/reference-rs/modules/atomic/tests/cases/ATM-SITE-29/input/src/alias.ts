import { css } from '@reference-ui/react'

const red = 'crimson'
const alsoRed = red
const third = alsoRed
const base = { color: 'teal', margin: '6px' }
const button = base

// SPEC-V2-34: scalar and object alias chains resolve transitively.
export const a = css({ color: alsoRed })
export const b = css({ color: third })
export const c = css({ ...button })
export const d = css({ color: button.color })
