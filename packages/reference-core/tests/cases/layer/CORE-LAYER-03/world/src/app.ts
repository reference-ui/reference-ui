// Entry for the CORE-LAYER-03 world. It takes the generated css runtime and
// paints the animation probe and the display-font probe. The spec proves the
// keyframes and font face print once in the global layer and the animation
// actually runs.
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
