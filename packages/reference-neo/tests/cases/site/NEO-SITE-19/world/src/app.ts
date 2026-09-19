// Entry for the NEO-SITE-19 world. It styles one node with a call-form
// merge list mixing two margin elements and a falsy hole, so the sheet
// merges every element and the runtime paints the last one.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// @ts-expect-error: the false hole widens to boolean — the merge pin needs the literal hole
el('target').className = css([{ margin: '10px' }, { margin: '20px' }, false])
