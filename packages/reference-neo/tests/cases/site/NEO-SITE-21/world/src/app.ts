// Entry for the NEO-SITE-21 world. It styles two nodes mixing an
// impure-helper color leaf with a static margin sibling, so the margins
// paint and the refused colors resolve to nothing, plus a third node
// whose fenced pure-helper color paints (SPEC-V2-39).
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

// Blue, not red: the refused arms resolve to 'red' at runtime, so a pure
// red atom would let them paint through the runtime table and break the
// refuse isolation this case pins.
const pureColor = () => 'blue'
el('pure').className = css({ color: pureColor(), margin: '30px' })
