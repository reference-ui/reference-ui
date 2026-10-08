import { Div } from '@reference-ui/react'

const n = 2

export const Fold = () => (
  <Div
    order={n * 4}
    width={n + 'px'}
    color={'a' && 'blue'}
    bg={1 === 1 ? 'black' : 'white'}
  />
)
