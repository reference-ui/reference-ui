/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import * as React from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

function withPad(Base: React.ComponentType<StyleProps>) {
  return (props: StyleProps) => <Base {...props} />
}

function makeBase(): React.ComponentType<StyleProps> {
  return Div
}

// The argument is a call, so no component binding names the wrapped component.
export const Unresolved = withPad(makeBase())

export const Padded = withPad(Div)
