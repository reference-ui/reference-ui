// Entry for the NEO-CHAIN-07 world. It takes the rhythm probe node and
// emits one static `140r` max-width class for it: the call site never moves,
// so every phase's painted pixels read the effective `--spacing-root`
// straight off the cascade winner the merges below it arrange.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('rhythm').className = css({ maxWidth: '140r' })
