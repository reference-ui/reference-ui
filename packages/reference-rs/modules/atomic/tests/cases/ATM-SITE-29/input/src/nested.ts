import { css } from '@reference-ui/react'

declare const isActive: boolean

const s = { _hover: { ...(isActive ? { color: 'red' } : { color: 'blue' }) } }
const r = { padding: { base: '1r', md: '2r' } }
const t = { _dark: { color: 'indigo' } }

// SPEC-V2-24: nested conditions and responsive maps survive const spreads.
export const a = css({ ...s })
export const b = css({ ...r })
export const c = css({ ...t })
