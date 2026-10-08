import { css } from '@reference-ui/react'

export const a = css({ 'input:hover &': { color: 'red.500' } })
export const b = css({ ':focus > &': { color: 'blue.500' } })
