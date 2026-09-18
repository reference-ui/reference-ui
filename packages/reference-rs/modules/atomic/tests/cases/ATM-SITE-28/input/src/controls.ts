import { css } from '@reference-ui/react'

// SPEC-V2-02: unmutated `let`/`var` resolve exactly like `const`.
let accent = 'blue.600'
export const g = css({ color: accent })

var depth = '4px'
export const h = css({ padding: depth })

const steady = 'green'
export const i = css({ color: steady })
