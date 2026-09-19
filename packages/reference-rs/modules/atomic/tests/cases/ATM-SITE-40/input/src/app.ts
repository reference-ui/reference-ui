import { css } from '@reference-ui/react'
import { brand as primary, theme as palette, sizes as dims } from './tokens'

// Aliased scalar import: `primary` resolves to the `brand` export.
export const a = css({ color: primary })

// Aliased object import: spreads and member reads follow the alias.
export const b = css({ ...palette, padding: '4px' })
export const c = css({ color: palette.color })

// Aliased array import: indexed reads follow the alias.
export const d = css({ margin: dims[1] })
