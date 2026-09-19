import { css } from '@reference-ui/react'
import { raccent, rx, xtone } from './rmid'

// Re-exported helpers fold: import-then-export, aliased export-from, and a
// re-exported function declaration (SPEC-V2-57).
export const re1 = css({ color: xtone('violet') })
export const re2 = css({ color: rx('indigo') })
export const re3 = css({ backgroundColor: raccent() })
