import { css } from '@reference-ui/react'
import { shared, swatches } from './shared'

const styles = { color: 'red', padding: '4px' }
const theme = { colors: { color: 'blue' } }
const flat = { margin: '1r' }

declare const cond: boolean
declare const fn: () => Record<string, string>
declare const args: object[]
declare const missing: Record<string, string>

const count = 4
const yes = true

let dying = { color: 'crimson' }
dying.color = 'pink'

export const wholeObject = css(styles)
export const memberArg = css(theme.colors)
export const importedArg = css(shared)
export const importedMember = css(swatches.tone)
export const wrappedArg = css(styles as const)
export const callArg = css(fn())
export const scalarArg = css(count)
export const missingArg = css(missing)
export const missingMember = css(theme.missing)
export const deepMember = css(theme.colors.color.deep)
export const logicalArg = css({ color: 'green' }, cond && { margin: '3r' })
export const orArg = css(missing || { padding: '2r' })
export const constTrueArg = css(yes && { color: 'salmon' })
export const nullishGuard = css(null ?? { color: 'plum' })
export const spreadArg = css(...args)
export const mutatedArg = css(dying, { color: 'olive' })
export const stringHead = css('panda', { color: 'cyan' })
export const holes = css(false, null, undefined)
export const empty = css()
export const emptyObject = css({})
export const mergeList = css([flat, { color: 'teal' }, false])

export function shadowed(styles: object) {
  return css(styles)
}
