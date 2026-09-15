/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type CardProps = StyleProps & {
  id?: string
}

export function Card({ id, ...styleProps }: CardProps) {
  return <Div data-id={id} {...styleProps} />
}
