// app.ts — the NEO-WATCH-01 paint entry. It takes the probe node plus the
// generated css() runtime and emits one color class onto #paint. The spec
// rewrites this file mid-run between two color spellings to prove a watched
// edit repaints the browser, then restores the brand spelling in a finally.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('paint').className = css({
  color: 'brand',
})
