// Entry for the CORE-CHAIN-16 plain package, `plain-glyphs`: a React package not built on Reference UI, the shape of an
// icon set from the registry. It takes a `color` prop and emits a span coloured inline; it has no system and no
// Reference runtime, so a style-named prop on its tag is the package's own prop, never a style for the app to back.
import { createElement, type ReactElement } from 'react'

export function Glyph({ color }: { color?: string }): ReactElement {
  return createElement('span', { style: { color } }, '*')
}
