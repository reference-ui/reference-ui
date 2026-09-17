import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('anim').className = css({
  color: 'ink',
  animation: 'fadeSlide 1s ease-in-out infinite',
})

el('fontprobe').className = css({
  color: 'ink',
  fontFamily: 'display',
})
