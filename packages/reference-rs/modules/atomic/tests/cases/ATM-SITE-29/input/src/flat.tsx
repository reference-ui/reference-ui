import { Div } from '@reference-ui/react'

const tokens = { colors: { red: '#f00' } }
const accent = tokens.colors.red

export const Member = () => <Div color={tokens.colors.red} bg={accent} />
