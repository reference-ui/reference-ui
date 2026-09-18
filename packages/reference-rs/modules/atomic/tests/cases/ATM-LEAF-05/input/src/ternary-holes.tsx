import { Div } from '@reference-ui/react'

export const Comp = ({ isWide }: { isWide: boolean }) => (
  <Div p={['1r', null, isWide ? '4r' : '2r']} />
)
