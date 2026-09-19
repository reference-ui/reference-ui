import { css } from '@reference-ui/react'

declare const flag: boolean
declare const pick: () => string
declare const dynA: string
declare const dynB: string

// Tabs isSelected shape: dynamic consequent, literal alternate.
const selA = flag ? pick() : false
// Mirror position: literal consequent, dynamic alternate.
const selB = flag ? false : pick()
// Both arms dynamic: the binding carries nothing at all.
const none = flag ? dynA : dynB
// Tabs isDisabled shape: coalesce chain with a literal tail.
const dis = dynA ?? dynB ?? false
// Truthy-tail coalesce: the kept leaf must not fold a test either.
const coal = dynA ?? 'blue.500'
// Partial value union for the value-position guard below.
const tone = flag ? 'red.500' : pick()
// Partial entry for the member-test shape.
const part = { sel: flag ? pick() : false }
// Partial base for the nested comparison shape.
const mode = dynA ?? 'line'
const isLine = mode === 'line'

// Every partially static guard gates whole css() objects: each test stays
// open and both blocks lower, exactly like a style-prop test.
export const gatedA = css(selA ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedB = css(selB ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedNone = css(none ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedDis = css(dis ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedNeg = css(!selA ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedMember = css(part.sel ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedNested = css(isLine && selA ? { color: 'red.500' } : { color: 'blue.500' })
export const gatedCoal = css(coal ? { color: 'red.500' } : { color: 'green.500' })

// The value-position guard: a partial binding still scoops its kept leaf.
export const valueUnion = css({ color: tone })
export const valueCoal = css({ color: coal })
