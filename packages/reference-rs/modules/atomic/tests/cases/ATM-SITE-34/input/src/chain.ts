import { css } from '@reference-ui/react'

const tokens = { color: 'red' }
export const a = css({ color: tokens?.color, padding: '4px' })

const theme = { primary: 'blue.600', gap: 2 }
export const b = css({ color: theme?.primary, order: theme?.gap })

const t = { colors: { red: '#f00' } }
export const c = css({ color: t?.colors?.red })

declare const flag: boolean
const tones = { tone: flag ? 'red' : 'blue' }
export const d = css({ color: tones?.tone })

declare const maybe: { foo: string } | undefined
export const e = css({ color: maybe?.foo, margin: '2r' })
