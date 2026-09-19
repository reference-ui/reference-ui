import { css } from '@reference-ui/react'
import { clash } from './clash-a'

// Unaliased import from A folds A's helper (SPEC-V2-57 collision probe).
export const c1 = css({ color: clash() })
