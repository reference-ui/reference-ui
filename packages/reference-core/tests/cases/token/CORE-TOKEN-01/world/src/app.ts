// Entry for the TOKEN-01 world: paints the #probe, #border-ref probes through the generated
// runtime. Takes the synced css bindings and emits the DOM the specs assert against.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  border: '2px solid {colors.red.500}',
})
