import * as React from 'react'
import { createIcon } from './createIcon'

const Outline = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function Outline(props, ref) {
    return <svg ref={ref} {...props} />
  }
)

const Filled = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function Filled(props, ref) {
    return <svg ref={ref} {...props} />
  }
)

export const CodeIcon = createIcon(Outline, Filled, 'CodeIcon')
