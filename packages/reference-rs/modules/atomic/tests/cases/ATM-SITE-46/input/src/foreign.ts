import { css } from '@reference-ui/react'
import { keyframes } from 'some-lib'

export const foreign = keyframes({ from: { opacity: 0 } })
export const foreign2 = foreign

export const z = css({ animationName: foreign, margin: '6r' })
export const y = css({ animationName: foreign2, margin: '7r' })
