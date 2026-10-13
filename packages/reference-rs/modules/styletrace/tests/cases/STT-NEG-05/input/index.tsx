/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import * as React from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

// A class component: its StyleProps are not traced in v1.
export class Card extends React.Component<CardProps> {
  render() {
    return <Div {...this.props} />
  }
}

// A class whose props expose no StyleProps has nothing to trace or warn about.
export class Label extends React.Component<{ text: string }> {
  render() {
    return <span>{this.props.text}</span>
  }
}

export function Tile(props: StyleProps) {
  return <Div {...props} />
}
