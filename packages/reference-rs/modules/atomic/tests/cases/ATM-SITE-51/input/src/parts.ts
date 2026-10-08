import { css } from '@reference-ui/react'

const gap = '4px'
export const a = css({ padding: `${(gap)}` })
export const b = css({ margin: `${gap as const}` })

const n = 8
export const c = css({ marginTop: `${-n}px` })

export const d = css({ width: `calc(${2} * ${n}px)` })

export const e = css({ color: `${`red`}` })

const pad = '8px'
export const f = css({ padding: `${pad}!` })

const flag = true
export const g = css({ fontFamily: `${flag}` })

export const h = css({ fontFamily: `${null}` })
export const i = css({ fontFamily: `${undefined}` })
