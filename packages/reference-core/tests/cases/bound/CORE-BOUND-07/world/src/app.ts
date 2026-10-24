// Entry for the CORE-BOUND-07 world: one red rule in src/, the root of the included tree.
// It takes the core style function and emits a single exported rule. The spec adds a FIFO and a link to it beside this file, and the sheet must stay the same.
import { css } from '@reference-ui/react'

export const a = css({ color: 'red' })
