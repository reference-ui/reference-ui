import { css } from '@reference-ui/react'

declare const dyn: string

// Dynamic slot warns and is omitted; the null hole skips silently and
// every static leaf keeps its breakpoint (v2 `calls.rs:1922` twin, where
// v2 stays silent and we warn).
export const a = css({ padding: ['4px', null, dyn] })
export const b = css({ color: [dyn, 'black'] })
