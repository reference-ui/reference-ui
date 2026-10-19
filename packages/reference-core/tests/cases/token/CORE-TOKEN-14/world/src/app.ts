// Entry for the TOKEN-14 world: paints the #token, #hardcoded probes through the generated runtime.
// Takes the synced css bindings and emits the DOM the specs assert against.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('token').className = css({
  color: 'ui.progress.track.mixForeground',
})

el('hardcoded').className = css({
  color: 'var(--colors-ui-progress-track-mix-foreground)',
})
