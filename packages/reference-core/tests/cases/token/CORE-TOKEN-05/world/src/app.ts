// Entry for the TOKEN-05 world: paints the #top, #island, #nested probes through the generated
// runtime. Takes the synced css bindings and emits the DOM the specs assert against.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('top').className = css({
  color: 'brand',
})

el('nested').className = css({
  color: 'brand',
})
