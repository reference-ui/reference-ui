/**
 * T09 forwarding guard for the pinned Overlay part roots. A consumer style
 * prop on `Overlay.Arrow` / `Overlay.Handle` must win over the part's baked-in
 * geometry/chrome, and the default (no override) must stay byte-identical.
 * Static markup is enough: precedence is pure prop resolution, not paint.
 */
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Div } from '@reference-ui/react'
import { OverlayArrow } from './Arrow'
import { OverlayHandle } from './Handle'
import { PopoverArrow } from '../../Popover/parts/Arrow'
import { TooltipArrow } from '../../Tooltip/parts/Arrow'

/** Root `class` attribute from a rendered fragment. */
function classNameOf(markup: string): string {
  return markup.match(/class="([^"]*)"/)?.[1] ?? ''
}

describe('Overlay part root forwarding (T09)', () => {
  it('Overlay.Arrow: default geometry is unchanged and a consumer width wins', () => {
    const defaultArrow = classNameOf(renderToString(<OverlayArrow />))
    const defaultDiv = classNameOf(
      renderToString(<Div position="absolute" width="2r" height="2r" pointerEvents="none" />)
    )
    expect(defaultArrow).toBe(defaultDiv)

    const overridden = classNameOf(renderToString(<OverlayArrow width="6r" />))
    const overriddenDiv = classNameOf(
      renderToString(<Div position="absolute" width="6r" height="2r" pointerEvents="none" />)
    )
    expect(overridden).toBe(overriddenDiv)
    expect(overridden).not.toBe(defaultArrow)
  })

  it('Overlay.Handle: default chrome is unchanged and a consumer bg wins', () => {
    const defaultHandle = classNameOf(renderToString(<OverlayHandle />))
    const defaultDiv = classNameOf(
      renderToString(
        <Div
          width="8r"
          height="1r"
          borderRadius="full"
          bg="colors.gray.400"
          mx="auto"
          my="2r"
          cursor="grab"
          touchAction="none"
        />
      )
    )
    expect(defaultHandle).toBe(defaultDiv)

    const overridden = classNameOf(renderToString(<OverlayHandle bg="colors.red.500" />))
    const overriddenDiv = classNameOf(
      renderToString(
        <Div
          width="8r"
          height="1r"
          borderRadius="full"
          bg="colors.red.500"
          mx="auto"
          my="2r"
          cursor="grab"
          touchAction="none"
        />
      )
    )
    expect(overridden).toBe(overriddenDiv)
    expect(overridden).not.toBe(defaultHandle)
  })

  it('Popover.Arrow and Tooltip.Arrow inherit the Overlay.Arrow override', () => {
    const expected = classNameOf(
      renderToString(<Div position="absolute" width="6r" height="2r" pointerEvents="none" />)
    )
    expect(classNameOf(renderToString(<PopoverArrow width="6r" />))).toBe(expected)
    expect(classNameOf(renderToString(<TooltipArrow width="6r" />))).toBe(expected)
  })
})
