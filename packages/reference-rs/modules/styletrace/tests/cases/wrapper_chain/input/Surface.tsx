/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Div, type StyleProps } from '@reference-ui/react'

export type SurfaceProps = StyleProps & {
  elevation?: number
}

export function Surface(props: SurfaceProps) {
  return <Div {...props} />
}