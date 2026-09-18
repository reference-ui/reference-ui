import { css } from '@reference-ui/react'

const styles = { color: 'red', padding: '4px' }
const theme = { colors: { primary: 'blue' } }

declare const cond: boolean
declare const fn: () => Record<string, string>
declare const args: object[]

export const wholeObject = css(styles)
export const memberArg = css(theme.colors)
export const callArg = css(fn())
export const logicalArg = css({ color: 'green' }, cond && { margin: '3r' })
export const spreadArg = css(...args)
export const stringHead = css('panda', { color: 'cyan' })
export const holes = css(false, null, undefined)
export const empty = css()
export const emptyObject = css({})
