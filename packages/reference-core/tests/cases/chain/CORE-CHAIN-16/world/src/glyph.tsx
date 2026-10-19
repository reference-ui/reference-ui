// Plain-package use site for the CORE-CHAIN-16 world. It takes `Glyph` from `plain-glyphs`, an installed package not
// built on Reference UI, and emits it with a style-named prop. The tag is not a Reference component, so sync must stay
// silent here and lower nothing for it, whatever the app composes.
import type { ReactElement } from 'react'
import { Glyph } from 'plain-glyphs'

export function Glyphs(): ReactElement {
  return <Glyph color="chain16Glyph" />
}
