// Utility source for the CORE-LAYERS-13 extends upstream. It takes three css() calls: a base
// colour, a dark-mode colour and a wide-container colour. Each is ranked against the layer.

import { css } from '@reference-ui/react'

export const extInkClass = css({ color: 'extInk' })
export const extDarkClass = css({ _dark: { color: 'extDark' } })
export const extSmClass = css({ sm: { color: 'extSm' } })
