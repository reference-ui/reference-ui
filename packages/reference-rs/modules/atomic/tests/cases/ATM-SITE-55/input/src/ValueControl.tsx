import { css } from '@reference-ui/react'
import { brand } from './tokens'

// Controls: direct Reference identity still works, and the value import
// resolves through the const path exactly as before (no identity recorded).
export const a = css({ color: brand })
