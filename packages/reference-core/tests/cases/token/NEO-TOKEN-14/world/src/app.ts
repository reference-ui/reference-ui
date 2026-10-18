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
