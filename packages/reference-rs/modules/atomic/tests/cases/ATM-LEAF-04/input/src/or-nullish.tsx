import { Div } from '@reference-ui/react'

export const Fallbacks = ({ dynamicColor }: { dynamicColor?: string }) => (
  <Div color={'red' || 'blue'} bg={dynamicColor ?? 'green'} />
)
