import { css } from '@reference-ui/react'
import { hop, hopAlias } from './hop-barrel'

// Multi-hop and aliased barrel chains fold through the walk (SPEC-V2-57).
export const h1 = css({ color: hop('aa1111') })
export const h2 = css({ backgroundColor: hopAlias('bb2222') })
