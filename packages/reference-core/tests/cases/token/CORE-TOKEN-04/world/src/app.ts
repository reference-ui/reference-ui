// Entry for the TOKEN-04 world: paints the #probe, #shadow-ref probes through the generated
// runtime. Takes the synced css bindings and emits the DOM the specs assert against.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  boxShadow: '0 0 0 3px {colors.pink.400/30}',
})
