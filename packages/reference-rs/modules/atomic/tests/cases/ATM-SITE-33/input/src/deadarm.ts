import { css } from '@reference-ui/react'

const dark = true

// SPEC-V2-66: a folded test compiles the live arm only and names the dead.
export const a = css({ color: true ? 'white' : 'black' })
export const b = css({ color: dark ? 'red' : 'blue' })
export const c = css({ color: (2 + 2 === 4 ? 'red' : 'blue') })
export const d = css({ color: (!dark ? 'red' : 'blue') })
export const e = css({ ...(false ? { padding: '1' } : { padding: '2' }) })
export const f = css({ _hover: true ? { color: 'red' } : { color: 'blue' } })
export const g = css(true ? { margin: '1' } : { margin: '2' })
export const h = css({ color: false ? 'red' : 'blue' })
