// Entry for the NEO-COND-02 world. It takes the root, twin, and live
// nodes from the page and emits the container macro onto the root plus
// one css() class string onto both probes, so the probes share a base
// background and a hover/container/theme triple arm that paints paper
// only when the root is wide, dark mode holds, and hover is present.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('root').className = css({ container: true })

const cls = css({
  bg: 'ink',
  _hover: { sm: { _dark: { bg: 'paper' } } },
})

el('twin').className = cls
el('live').className = cls
