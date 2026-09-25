// @ts-nocheck
import { Div } from '@reference-ui/react'

declare const cond: boolean

export const logical = <Div css={cond && { color: 'green' }} />
