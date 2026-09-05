import * as React from 'react'
import { Div, useColorMode, type PrimitiveProps } from '@reference-ui/react'

/**
 * Portaled overlay surfaces render under `document.body`, outside the themed
 * `data-layer` ancestor that StyleProps rely on. Passing explicit `colorMode`
 * re-establishes layer scope on the portaled node so semantic tokens such as
 * `ui.dialog.background` resolve correctly in dark and light mode.
 *
 * @see packages/reference-core/src/system/build/primitives/generate.ts
 *      (`shouldEmitDataLayer` when `hasExplicitColorMode`)
 */
export type OverlayPortaledSurfaceProps = PrimitiveProps<'div'>

export function OverlayPortaledSurface({
  children,
  colorMode: colorModeProp,
  ...props
}: OverlayPortaledSurfaceProps) {
  const inheritedColorMode = useColorMode()
  const colorMode = colorModeProp ?? inheritedColorMode

  return (
    <Div colorMode={colorMode} {...props}>
      {children}
    </Div>
  )
}
