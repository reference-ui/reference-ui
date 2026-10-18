/**
 * Primitive-named library fixture.
 * Exports baseSystem for downstream extends[] consumers (chain T18), the
 * generated `Button` primitive bound to this package's name, and two traced
 * wrappers: `Tile` (forwards style props) and `Chip` (owns `size`).
 *
 * Run `ref sync` in primitive-named-library before using.
 */
export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'
export { Button } from '@reference-ui/react'
export { Tile } from './components/Tile'
export type { TileProps } from './components/Tile'
export { Chip } from './components/Chip'
export type { ChipProps, ChipSize } from './components/Chip'
export { chipPaddingLg, chipPaddingSm } from './tokens'
