/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

export function BodyCard(props: CardProps) {
  const { color } = props
  return <Div color={color} />
}

export function PlainTitle({ title }: { title: string }) {
  return <div>{title}</div>
}
