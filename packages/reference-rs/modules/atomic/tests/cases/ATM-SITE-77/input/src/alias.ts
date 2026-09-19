import { css } from '@reference-ui/react'
import { cond as theme, fallback as fb } from './tokens'

// Aliased imports of the conditional objects: both arms fan out exactly
// like the plain imported instance (SPEC-V2-52 over SPEC-V2-55).
export const aliasSpread = css({ ...theme })
export const aliasFallback = css({ ...fb })
export const aliasMember = css({ color: theme.color })
