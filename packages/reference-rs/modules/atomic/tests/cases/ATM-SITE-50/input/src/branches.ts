import { css } from '@reference-ui/react'

const styles = { color: 'red' }
const other = { color: 'blue' }
const accents = { glow: { color: 'indigo' } }

declare const cond: boolean
declare const fn: () => Record<string, string>
declare const ok: boolean

export const identArms = css(cond ? styles : other)
export const memberArms = css(cond ? accents.glow : { color: 'cyan' })
export const logicalArm = css(cond ? (ok && { color: 'violet' }) : { color: 'magenta' })
export const nullArm = css(cond ? { color: 'green' } : null)
export const callArm = css(cond ? { color: 'pink' } : fn())
export const nestedArms = css(cond ? (cond ? { color: 'teal' } : { color: 'navy' }) : { color: 'lime' })
