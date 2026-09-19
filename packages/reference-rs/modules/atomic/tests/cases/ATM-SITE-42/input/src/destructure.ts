import { css } from '@reference-ui/react'

const tokens = { color: 'red', padding: '4px', margin: '8px' }
const { color } = tokens
export const a = css({ color })

const theme = { primary: 'blue.600' }
const { primary: accent } = theme
export const b = css({ color: accent })

const { color: _taken, ...space } = tokens
export const c = css({ ...space })
export const d = css({ margin: space.margin })

const sizes = ['4px', '8px']
const [small, medium] = sizes
export const e = css({ padding: medium })

const [gapA, gapB] = ['1px', '2px']
export const f = css({ padding: gapA, margin: gapB })

const props = { fontSize: 16 }
const { color: fallback = 'red' } = props
export const g = css({ color: fallback })

const present = { color: 'blue' }
const { color: kept = 'red' } = present
export const h = css({ color: kept })

const key = 'primary'
const { [key]: computed } = theme
export const i = css({ color: computed })

declare const flag: boolean
const tones = { tone: flag ? 'red' : 'blue' }
const { tone } = tones
export const j = css({ color: tone })

const [first, ...restSizes] = sizes
const [second] = restSizes
export const k = css({ padding: second })

declare const unknownSource: { color: string }
const { ghost } = unknownSource
export const l = css({ color: ghost, padding: '4px' })

void small
void first
