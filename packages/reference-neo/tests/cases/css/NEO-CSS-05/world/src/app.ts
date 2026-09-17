// Entry for the NEO-CSS-05 world. It takes the holes and empty nodes from
// the page and emits one css() class string per node, so the holes element
// carries a live color beside three hole leaves while the empty element
// carries holes only and resolves to no class at all.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('holes').className = css({
  color: 'brand',
  backgroundColor: null,
  borderColor: false,
  outlineColor: undefined,
})

el('empty').className = css({
  color: null,
  backgroundColor: false,
  borderColor: undefined,
})
