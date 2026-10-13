/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Div, type StyleProps } from '@reference-ui/react'

export type SectionProps = StyleProps & {
  title?: string
}

export function Section({ title, ...styleProps }: SectionProps) {
  return <Div {...styleProps}>{title}</Div>
}
