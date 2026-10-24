// Palette for the CORE-BOUND-03 world: one green rule that lives in lib/, outside the include.
// It takes the core style function and emits a single exported rule. The spec links it into src/ as palette, so its colour reaches the sheet only through that link, once.
import { css } from '@reference-ui/react'

export const palette = css({ color: 'green' })
