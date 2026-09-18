import { css } from '@reference-ui/react'

export const a = css({ order: -(pick ? 4 : 8) })
export const b = css({ order: -[1, 2] })
export const c = css({ order: -({ v: 1 }) })
export const d = css({ order: -unknownIdent })

const theme = { gap: 2 }
export const e = css({ order: -theme.missing })

let shade = 4
shade = 8
export const f = css({ order: -shade })
