// Entry for the CORE-CHAIN-13 app. It takes the generated css runtime and paints one probe with the icon token.
// The app holds no upstream tokens of its own, so the paint proves the local light leaf resolves.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe-icon').className = css({ color: 'icon' })
