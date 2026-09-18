import { Div } from '@reference-ui/react'

export const FalsyGuards = () => (
  <Div
    border={false && '1px solid'}
    borderColor={0 && 'red'}
    outline={null && '2px solid'}
  />
)
