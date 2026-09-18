import { css, recipe } from '@reference-ui/react'

export const upCls = css({ color: 'up' })
export const sharedCls = css({ color: 'shared' })
export const card = recipe({ className: 'card', base: { color: 'up' } })
