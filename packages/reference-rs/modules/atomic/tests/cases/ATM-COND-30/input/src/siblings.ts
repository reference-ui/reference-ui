import { css } from '@reference-ui/react'

// Sibling combinators substitute on the utility path (v2
// `nested_selector_parity.rs:92`, `:125`).
export const a = css({ '& + &': { mt: '2r' } })
export const b = css({ '& ~ &': { mt: '4r' } })

// Two-level pseudo/descendant stack (v2 `:180`).
export const c = css({ '& > p': { '&:hover': { color: 'red' } } })

// Comma descendant list (v2 `:202`).
export const d = css({ '& .one, & .two': { color: 'blue' } })
