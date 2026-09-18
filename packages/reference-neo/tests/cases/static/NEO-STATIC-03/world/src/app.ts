// Entry for the NEO-STATIC-03 world. It takes the hit and miss nodes from
// the page and emits a runtime shade onto each through values the extractor
// cannot see, so the hit resolves to its static atom while the miss lands
// classless with its one dev diagnostic beside the painted hit.
import { css } from '@reference-ui/react'

declare global {
  interface Window {
    __staticDiagnostics: string[]
  }
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

window.__staticDiagnostics = []
const warn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  window.__staticDiagnostics.push(args.map(String).join(' '))
  warn(...args)
}

el('hit').className = paint('ember')
el('miss').className = paint('gold')

function paint(shade: string): string {
  return css({ color: shade })
}
