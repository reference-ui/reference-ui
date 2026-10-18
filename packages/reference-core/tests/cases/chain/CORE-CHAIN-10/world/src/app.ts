// Entry for the CORE-CHAIN-10 app. It takes the generated css runtime and paints the x probe in the token
// the diamond contests. The app holds no local tokens, so the paint proves the value it adopts through the
// single extends entry the spec wires mid-run.

import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe-x').className = css({ color: 'x' })
