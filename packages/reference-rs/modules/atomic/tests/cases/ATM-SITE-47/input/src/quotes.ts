import { css } from '@reference-ui/react'

// SPEC-V2-14: quoted runs survive the collapse verbatim.
export const a = css({ content: '"x  y"' })
export const b = css({ fontFamily: "'Fira  Code', monospace" })
