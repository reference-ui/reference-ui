/**
 * Mock package for the namespace re-export station. Its components reach the barrel only
 * through `export * as UI`, so their names must read UI.Button and UI.Card.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export function Button(props: StyleProps) {
  return <Div {...props} />
}

export function Card(props: StyleProps) {
  return <Div {...props} />
}

export function Plain() {
  return <span />
}
