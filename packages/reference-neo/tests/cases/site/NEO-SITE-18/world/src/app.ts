// Entry for the NEO-SITE-18 world. It styles one node with a static key
// plus a spread ternary on the same key, so the sheet unions every value
// and the runtime paints the winning arm.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const u = true
// @ts-expect-error: intentional static-plus-spread collision — the union pin needs both spellings
el('target').className = css({ padding: '0', ...(u ? { padding: '10px' } : { padding: '20px' }) })
