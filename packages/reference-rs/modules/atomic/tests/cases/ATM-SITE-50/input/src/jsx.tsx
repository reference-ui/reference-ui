import { Div } from '@reference-ui/react'

const styles = { color: 'red' }

declare const cond: boolean
declare const fn: () => Record<string, string>

export const ident = <Div css={styles} />
export const logical = <Div css={cond && { color: 'green' }} />
export const callCond = <Div _hover={fn()} />
export const wrapped = <Div css={{ color: 'blue' } as const} />
export const spreadList = <Div css={[{ color: 'pink' }, ...[{ color: 'teal' }]]} />
