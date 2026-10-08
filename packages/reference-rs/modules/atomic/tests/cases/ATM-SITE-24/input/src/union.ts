import { css } from '@reference-ui/react'

declare const u: boolean

export const after = css({ padding: '0', ...(u ? { padding: '1' } : { padding: '2' }) })
export const before = css({ ...(u ? { padding: '3' } : { padding: '4' }), padding: '5' })
