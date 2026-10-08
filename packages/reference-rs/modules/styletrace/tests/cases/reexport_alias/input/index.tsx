/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type PanelProps = StyleProps & {
  title?: string
}

const SurfaceInner = ({ title, ...styleProps }: PanelProps) => {
  return <Div {...styleProps}>{title}</Div>
}

export { SurfaceInner as Panel }
