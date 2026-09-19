import { css } from '@reference-ui/react'
import { nope as nah } from './tokens'

// Missing export through an alias: drops with a diagnostic naming the
// local name, sibling kept (v2 `cross_file.rs:488` drops silently).
export const a = css({ color: nah, padding: '12px' })
