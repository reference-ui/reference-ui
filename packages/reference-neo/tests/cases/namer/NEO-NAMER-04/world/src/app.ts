// Entry for the NEO-NAMER-04 world. It takes the live and miss nodes from
// the page and emits a static class onto the live node plus a dynamic shade
// call onto the miss node, before any sheet exists: the compiled sheet only
// arrives later as an injected inline style, the dev-bundler delivery order.
// The one dev diagnostic lands in the recording array beside the live paint,
// and the ordering evidence proves css() ran ahead of every sheet.
import { css } from '@reference-ui/react'

declare global {
  interface Window {
    __namerDiagnostics: string[]
    __lateOrder: { sheetsAtFirstCss: number; readyStateAtFirstCss: string }
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

window.__lateOrder = {
  sheetsAtFirstCss: document.styleSheets.length,
  readyStateAtFirstCss: document.readyState,
}

el('live').className = css({ color: 'ember' })
el('miss').className = paint('cobalt-900')

function paint(shade: string): string {
  return css({ color: shade })
}
