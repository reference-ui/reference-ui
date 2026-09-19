import { css } from '@reference-ui/react'

// Raw pseudo-element spelling lowers like the `_before` dialect (v2
// `nested_selector_parity.rs:433`).
export const a = css({ '&::after': { color: 'red' } })

// Single-level pseudo-class + pseudo-element compound (v2 `:466`).
export const b = css({ '&:hover::before': { color: 'blue' } })

// Comma pseudo-element list (v2 `:477`).
export const c = css({ '&::before, &::after': { color: 'green' } })
