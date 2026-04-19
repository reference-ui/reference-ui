import * as React from 'react'

import { createIcon } from './createIcon'
import type { IconProps } from './types'

const Outline = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function Outline(
  props,
  ref,
) {
  return <svg ref={ref} {...props} />
})

const Filled = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function Filled(
  props,
  ref,
) {
  return <svg ref={ref} {...props} />
})

export const StarIcon = createIcon(Outline, Filled, 'StarIcon')

export function ToolbarIcon(props: IconProps) {
  return <StarIcon {...props} />
}