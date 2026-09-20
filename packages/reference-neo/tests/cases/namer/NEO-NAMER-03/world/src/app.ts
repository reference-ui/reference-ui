// Entry for the NEO-NAMER-03 world. It takes the live and miss nodes from
// the page and emits a static class onto the live node plus a dynamic shade
// call onto the miss node, so the miss constructs its miss class while its
// one dev diagnostic lands in the recording array beside the live paint.
import { css } from '@reference-ui/react'

declare global {
  interface Window {
    __namerDiagnostics: string[]
  }
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

window.__namerDiagnostics = []
const warn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  window.__namerDiagnostics.push(args.map(String).join(' '))
  warn(...args)
}

el('live').className = css({ color: 'ember' })
el('miss').className = paint('cobalt-900')

function paint(shade: string): string {
  return css({ color: shade })
}
