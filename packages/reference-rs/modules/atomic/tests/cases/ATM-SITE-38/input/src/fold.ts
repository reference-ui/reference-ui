import { css } from '@reference-ui/react'

const space = 4
export const a = css({ marginTop: -space })

const n = 8
export const b = css({ order: +n })

const theme = { gap: 2 }
export const c = css({ order: -theme.gap })

const flag = true
export const d = css({ order: !flag })

const w = pick ? 4 : 8
export const e = css({ order: -w })

const m = pick ? 4 : 'auto'
export const f = css({ marginTop: -m })
