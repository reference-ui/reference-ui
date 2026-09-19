import { css } from '@reference-ui/react'

const n = 4
export const a = css({ width: `${n}px` })

const o = { p: 'red', gap: '4px' }
export const b = css({ color: `${o.p}` })

const first = 'red'
const second = 'blue'
export const c = css({ backgroundImage: `linear-gradient(${first}, ${second})` })

export const d = css({ marginTop: `${2}px`, marginBottom: `${o.gap}` })
