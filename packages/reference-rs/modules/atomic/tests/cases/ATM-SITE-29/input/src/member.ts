import { css } from '@reference-ui/react'

declare const flag: boolean

const tokens = { colors: { red: '#f00', deep: { ink: 'black' } }, gap: 2 }
const styles = { hover: { color: flag ? 'red' : 'blue' } }

// SPEC-V2-31: multi-hop reads, member-hop spreads, and `!` unwrapping.
export const a = css({ color: tokens.colors.red })
export const b = css({ color: tokens.colors.deep.ink })
export const c = css({ order: tokens.gap })
export const d = css({ color: tokens!.colors.red })
export const e = css({ ...styles.hover })
export const f = css({ color: styles.hover.color })
