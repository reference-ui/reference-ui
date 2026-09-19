import { css } from '@reference-ui/react'

declare const pick: boolean

export const wrappedArms = css(pick ? ({ color: 'pink' }) : ({ color: 'cyan' } as const))
