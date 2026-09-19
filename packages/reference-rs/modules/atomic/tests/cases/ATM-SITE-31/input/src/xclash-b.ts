import { css } from '@reference-ui/react'
import { clash } from './clash-b'

// Unaliased import from B folds B's helper — A's same-named helper never
// leaks across (SPEC-V2-57 collision probe).
export const c2 = css({ backgroundColor: clash() })
