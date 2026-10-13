/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import * as React from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

// A function HOC: the component it returns spreads its StyleProps into the parameter.
function withPad(Base: React.ComponentType<StyleProps>) {
  return (props: StyleProps) => <Base {...props} />
}

// An arrow HOC with an expression body.
const withFrame = (Base: React.ComponentType<StyleProps>) => (props: StyleProps) => (
  <Base {...props} />
)

// A forwardRef product around the passed-in component.
function withRef(Base: React.ComponentType<StyleProps>) {
  return React.forwardRef((props: StyleProps, ref) => <Base ref={ref} {...props} />)
}

// The returned component is an inner function declaration.
function withInner(Base: React.ComponentType<StyleProps>) {
  function Inner(props: StyleProps) {
    return <Base {...props} />
  }
  return Inner
}

function Plain(props: StyleProps) {
  return <Div {...props} />
}

function PlainText(props: { label: string }) {
  return <span>{props.label}</span>
}

export const PaddedBox = withPad(Div)
export const FramedBox = withFrame(Div)
export const RefBox = withRef(Div)
export const InnerBox = withInner(Div)
export const WrappedPlain = withPad(Plain)
// PlainText exposes no StyleProps, so this wrapper stays untraced.
export const LabelledText = withPad(PlainText)
