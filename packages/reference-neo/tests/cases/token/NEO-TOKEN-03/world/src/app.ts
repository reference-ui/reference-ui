import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('probe').className = css({
  backgroundColor: 'red.500/40',
})

el('passthrough').className = css({
  backgroundColor: 'rgb(251 146 60 / 0.3)',
})
