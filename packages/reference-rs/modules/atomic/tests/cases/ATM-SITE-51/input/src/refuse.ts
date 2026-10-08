import { css } from '@reference-ui/react'

export const a = css({ width: `${props.w}px`, color: 'red' })
export const b = css({ color: `${missing}`, margin: '4px' })
export const c = css({ color: `${pick()}`, padding: '2px' })
export const d = css({ order: `${2 + 3}`, marginTop: '1px' })

let shade = 'red'
shade = 'blue'
export const e = css({ color: `${shade}`, marginBottom: '3px' })

const n = 4
export const f = css({ order: -`${n}` })
export const g = css({ order: -`${dyn}`, marginLeft: '5px' })

export const h = css({ color: `${void 0}`, paddingTop: '6px' })
