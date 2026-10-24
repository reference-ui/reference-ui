// Entry for the CORE-BOUND-03 world: one red rule in src/, the root of the included tree.
// It takes the core style function and emits a single exported rule. The spec adds self-linked directories beside it, and the sheet must still hold this rule once.
import { css } from '@reference-ui/react'

export const a = css({ color: 'red' })
