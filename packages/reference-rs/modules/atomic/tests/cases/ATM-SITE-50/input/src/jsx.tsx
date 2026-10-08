import { Div } from '@reference-ui/react'

const styles = { color: 'red' }
const theme = { colors: { color: 'coral' } }
const hoverStyles = { color: 'maroon' }

declare const cond: boolean
declare const fn: () => Record<string, string>

export const ident = <Div css={styles} />
export const member = <Div css={theme.colors} />
export const condMember = <Div _hover={theme.colors} />
export const hoverIdent = <Div _hover={hoverStyles} />
export const logical = <Div css={cond && { color: 'green' }} />
export const callCond = <Div _hover={fn()} />
export const wrapped = <Div css={{ color: 'blue' } as const} />
export const spreadList = <Div css={[{ color: 'pink' }, ...[{ color: 'teal' }]]} />
