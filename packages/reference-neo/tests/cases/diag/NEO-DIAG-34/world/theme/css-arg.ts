import { css } from '@reference-ui/react'

declare const fn: () => Record<string, string>

export const callArg = css(fn())
