// Entry for the NEO-COND-12 world. It takes the motion, scheme, and
// paper nodes from the page and emits one css() class string per node,
// so each carries its base declaration plus one preset @media arm and
// paints the base until emulation flips the matching media query.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('motion').className = css({
  animation: 'spin 2s linear infinite',
  _motionReduce: { animation: 'none' },
})

el('scheme').className = css({
  color: 'ink',
  _osDark: { color: 'brand' },
})

el('paper').className = css({
  display: 'block',
  _print: { display: 'none' },
})
