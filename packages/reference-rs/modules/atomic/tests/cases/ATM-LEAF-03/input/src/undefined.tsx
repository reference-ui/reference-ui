import { Div } from '@reference-ui/react'

export const Comp = ({ a, b }: { a: boolean; b: boolean }) => (
  <Div color={a ? 'red' : undefined} bg={b ? void 0 : 'blue'} />
)
