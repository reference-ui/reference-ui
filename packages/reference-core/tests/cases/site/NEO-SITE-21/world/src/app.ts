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

// The refused arms resolve to 'red' at runtime, but the world never writes
// the literal: under harvest any written CSS value is information and would
// floor the refused sink, breaking the refuse isolation this case pins.
// Fragments are not CSS values, so the pool holds no red.
const RED = 'r' + 'e' + 'd'

const roll = (xs: string[]): string => xs[Math.floor(Math.random() * xs.length)]!
el('random').className = css({ color: roll([RED]), margin: '10px' })

async function fetchColor(): Promise<string> {
  return RED
}
el('async').className = css({ color: fetchColor(), margin: '20px' })

// Blue, not red: the refused arms resolve to 'red' at runtime, so a pure
// red atom would let them paint through the runtime table and break the
// refuse isolation this case pins.
const pureColor = () => 'blue'
el('pure').className = css({ color: pureColor(), margin: '30px' })
