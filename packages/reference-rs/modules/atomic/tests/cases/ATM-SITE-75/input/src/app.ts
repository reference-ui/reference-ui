import { css } from '@reference-ui/react'
import { ghost } from './missing'
import { nope } from './tokens'
import { getColor } from './helpers'

// Unresolvable specifier: drops with a diagnostic, sibling kept (v2
// `cross_file.rs:465` drops silently; ours diagnoses).
export const a = css({ color: ghost, padding: '4px' })

// Missing export: drops with a diagnostic, sibling kept (v2 `:488`).
export const b = css({ margin: nope, padding: '8px' })

// Bare imported function value: folds nowhere (v2 `:1310`).
export const c = css({ borderColor: getColor, padding: '12px' })
