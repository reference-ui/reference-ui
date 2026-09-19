import { css } from '@reference-ui/react'
import { cond, fallback } from './tokens'

declare const flag: boolean
declare const pick: () => string
declare const run: () => string
declare const x: string
declare const y: string

const local = { color: flag ? 'magenta' : 'plum' }
const dyn = { color: pick(), padding: '4px' }
const part = { color: flag ? 'white' : run() }
const both = { color: x ?? y }
const empty = {}

export const importedSpread = css({ ...cond })
export const importedFallback = css({ ...fallback })
export const importedMember = css({ color: cond.color })
export const localSpread = css({ ...local })
export const localMember = css({ color: local.color })
export const dynamicSpread = css({ ...dyn })
export const partialSpread = css({ ...part })
export const partialMember = css({ color: part.color })
export const bothDynamic = css({ ...both })
export const emptySpread = css({ ...empty })

import { apart } from './tokens'

const keys = { k: flag ? 'color' : run() }
const deep = { nested: { color: flag ? 'white' : run() } }
const getPart = () => part.color

export const importedPartial = css({ ...apart })
export const elementRead = css({ color: part['color'] })
export const keyRead = css({ [keys.k]: 'red' })
export const chainRead = css({ color: part?.color })
export const fenceRead = css({ color: getPart() })
export const deepRead = css({ color: deep.nested.color })

const mix = { ...(flag ? { color: { base: 'red' } } : { color: pick() }) }
const combo = { ...(flag ? part : { color: 'blue' }) }

export const mixedSpread = css({ ...mix })
export const unionSpread = css({ ...combo })

const ko = { a: 'margin', c: 'pink', b: flag ? 'x' : run() }
const getC = () => ko.c

export const keyNoTaint = css({ [ko.a]: '1r' })
export const fenceTaint = css({ color: getC() })
