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
export type OverlayPortaledSurfaceProps = PrimitiveProps<'div'> & {
  anchorNode?: HTMLElement | null
}

export const OverlayPortaledSurface = React.forwardRef<HTMLDivElement, OverlayPortaledSurfaceProps>(
  function OverlayPortaledSurface(
    {
      children,
      colorMode: colorModeProp,
      anchorNode,
      ...props
    },
    ref
  ) {
    const inheritedColorMode = useColorMode()
    const getDomColorMode = (el: HTMLElement | null | undefined): string | undefined => {
      if (!el) return undefined
      const themedAncestor = el.closest('[data-panda-theme], [data-color-mode], [data-theme]')
      return themedAncestor?.getAttribute('data-panda-theme') ??
        themedAncestor?.getAttribute('data-color-mode') ??
        themedAncestor?.getAttribute('data-theme') ??
        undefined
    }
    const anchorColorMode = getDomColorMode(anchorNode)
    const docColorMode =
      typeof document !== 'undefined'
        ? (getDomColorMode(document.documentElement) ?? getDomColorMode(document.body))
        : undefined

    const colorMode = colorModeProp ?? inheritedColorMode ?? anchorColorMode ?? docColorMode ?? 'dark'

    return (
      <Div ref={ref} colorMode={colorMode} {...props}>
        {children}
      </Div>
    )
  }
)
