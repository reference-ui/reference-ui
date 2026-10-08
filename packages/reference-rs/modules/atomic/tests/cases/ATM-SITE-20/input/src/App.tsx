import { css } from '@reference-ui/react'

export const a = css({ fooBar: 'x', divideX: '40px', color: 'red' })

const extras = { color: 'green', frobnicate: 'x' }

export const b = css({ ...extras })
