// Entry for the TOKEN-06 world: paints the #probe, #direct probes through the generated runtime.
// Takes the synced css bindings and emits the DOM the specs assert against.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  backgroundColor: 'critical',
})

el('direct').className = css({
  backgroundColor: 'red.500',
})
