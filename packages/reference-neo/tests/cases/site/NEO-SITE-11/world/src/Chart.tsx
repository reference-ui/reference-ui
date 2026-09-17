// Local Chart host for the NEO-SITE-11 world. It takes the author's style
// props and emits them through the Div primitive, so extraction reads the
// Chart site while the browser paints through the primitive runtime.
import { Div } from '@reference-ui/react'

interface ChartProps {
  p?: string
  id?: string
}

export function Chart(props: ChartProps) {
  return <Div {...props}>chart</Div>
}
