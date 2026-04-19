import * as React from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

export const Card = React.forwardRef<HTMLDivElement, StyleProps>(function Card(props, ref) {
  return <Div ref={ref} {...props} />
})