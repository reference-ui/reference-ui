// Entry for the NEO-CSS-14 world. It takes a palette array no static site
// reads, paints the probe through a dynamic member read over it, and
// exposes a runtime probe for arbitrary shades — so the palette colors
// paint through harvested plans while an unwritten shade misses with its
// one dev diagnostic beside the paints.
import { css } from '@reference-ui/react'

declare global {
  interface Window {
    __css14Diagnostics: string[]
    __cssProbe: (shade: string) => string
  }
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

window.__css14Diagnostics = []
const warn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  window.__css14Diagnostics.push(args.map(String).join(' '))
  warn(...args)
}

// The palette lives only here: no static site names these colors, so every
// plan behind them is harvested onto the refused sink below.
const palette = ['red', 'blue']

function paint(i: number): string {
  return css({ color: palette[i] })
}

el('probe').className = paint(0)

window.__cssProbe = (shade: string): string => css({ color: shade })
