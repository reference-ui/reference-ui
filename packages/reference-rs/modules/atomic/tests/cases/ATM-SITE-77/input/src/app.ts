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
