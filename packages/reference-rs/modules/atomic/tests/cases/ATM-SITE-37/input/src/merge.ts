import { css } from '@reference-ui/react'

declare const rest: object
const extras = [{ color: 'orange' }, { color: 'purple' }]
const tags = ['panda']
let mutEx = [{ color: 'lime' }]
mutEx = [{ color: 'black' }]

// Dynamic spreads refuse with siblings kept; literal and const spreads merge.
export const merged = css([{ color: 'red' }, ...rest, { color: 'blue' }])
export const literalMerge = css([{ color: 'green' }, ...[{ color: 'pink' }], { color: 'cyan' }])
export const constMerge = css([{ color: 'teal' }, ...extras, { color: 'navy' }])
export const leafMerge = css([...tags, { color: 'olive' }])
export const staleMerge = css([{ color: 'lime' }, ...mutEx, { color: 'maroon' }])
