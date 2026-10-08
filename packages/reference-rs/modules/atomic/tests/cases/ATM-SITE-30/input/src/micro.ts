import { css, cx } from '@reference-ui/react'

const color = 'blue'
export const shorthand = css({ color })
export const emptyObject = css({})
export const stringHead = css('panda', { color: 'green' })
export const nestedCx = cx('card', css({ color: 'purple' }))
export const noArg = css()
