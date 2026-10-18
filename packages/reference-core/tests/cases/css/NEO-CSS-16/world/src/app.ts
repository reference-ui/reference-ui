// Entry for the NEO-CSS-16 world. It takes three probe nodes from the page
// and emits one css() class string per probe: two static arbitrary rhythm
// steps plus one width read from a data attribute no scan sees, so the
// miss constructs its miss class while its one dev diagnostic lands in the
// recording array beside the painted probes.
import { css } from '@reference-ui/react'

declare global {
  interface Window {
    __continuityDiagnostics: string[]
  }
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

window.__continuityDiagnostics = []
const warn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  window.__continuityDiagnostics.push(args.map(String).join(' '))
  warn(...args)
}

el('big').className = css({ maxWidth: '140r' })
el('fractional').className = css({ maxWidth: '137.5r' })
el('miss').className = paint(el('miss').dataset.w ?? 'fallback')

function paint(width: string): string {
  return css({ maxWidth: width })
}
