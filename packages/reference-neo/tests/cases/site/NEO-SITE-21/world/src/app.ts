// Entry for the NEO-SITE-21 world. It styles two nodes mixing an
// impure-helper color leaf with a static margin sibling, so the margins
// paint and the refused colors resolve to nothing.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const roll = (xs: string[]): string => xs[Math.floor(Math.random() * xs.length)]!
el('random').className = css({ color: roll(['red']), margin: '10px' })

async function fetchColor(): Promise<string> {
  return 'red'
}
el('async').className = css({ color: fetchColor(), margin: '20px' })
