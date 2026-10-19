// Entry for the EDGE-02 world: paints the #rounded, #pill, #dotted probes through the generated
// runtime. Takes the synced css bindings and emits the DOM the specs assert against.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('rounded').className = css({
  borderRadius: 'md',
})

el('pill').className = css({
  borderRadius: 'full',
})

el('dotted').className = css({
  borderRadius: 'radii.md',
})
