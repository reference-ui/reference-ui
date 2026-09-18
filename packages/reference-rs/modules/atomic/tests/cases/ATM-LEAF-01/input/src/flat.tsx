import { Div } from '@reference-ui/react'

export const Comp = ({ active }: { active: boolean }) => (
  <Div bg={active ? 'n300' : 'n100'} />
)
