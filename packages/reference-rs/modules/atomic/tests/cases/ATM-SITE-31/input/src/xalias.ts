import { css } from '@reference-ui/react'
import { xtone as xshade } from './helpers'

// Aliased value import folds through the binding (SPEC-V2-57).
export const a1 = css({ color: xshade('green') })
