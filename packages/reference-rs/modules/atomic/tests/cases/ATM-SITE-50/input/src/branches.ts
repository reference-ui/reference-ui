import { css } from '@reference-ui/react'

const styles = { color: 'red' }
const other = { color: 'blue' }

declare const cond: boolean
declare const fn: () => Record<string, string>

export const identArms = css(cond ? styles : other)
export const nullArm = css(cond ? { color: 'green' } : null)
export const callArm = css(cond ? { color: 'pink' } : fn())
export const nestedArms = css(cond ? (cond ? { color: 'teal' } : { color: 'navy' }) : { color: 'lime' })
