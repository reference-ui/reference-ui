/**
 * Test file.
 * Mirrors the generated recipe variant types: a conditional whose `infer V` is forwarded into a generic alias whose parameter is also V.
 * It inputs one recipe-typed component and emits one traced component.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type VariantSelection<V> = {
  [K in keyof V]?: string
}
type VariantProps<T> = T extends { variants: infer V } ? VariantSelection<V> : {}
type BadgeProps = StyleProps & VariantProps<{ variants: { tone: { soft: {} } } }>

export function Badge(props: BadgeProps) {
  return <Div {...props} />
}
