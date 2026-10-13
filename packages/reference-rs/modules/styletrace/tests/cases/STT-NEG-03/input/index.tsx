/**
 * Entry file for the STT-NEG-03 station: Probe calls splitCssProps() with no
 * argument and must be ignored, while Card traces as the normal primitive use.
 */
import { splitCssProps } from '@reference-ui/styled/jsx'
import { Div, type StyleProps } from '@reference-ui/react'

export function Probe() {
  const [styleProps, elementProps] = splitCssProps()
  return <div {...elementProps} />
}

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}
