// Entry for the NEO-SITE-18 world. It styles one node with a static key
// plus a spread ternary on the same key, so the sheet unions every value
// and the runtime paints the winning arm.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

// An open test: statically unknown (a DOM read the extractor cannot fold),
// runtime-true (the target node exists). A folded `const u = true` would
// compile the live arm only and name the dead arm (correct per v2, pinned
// at ATM-SITE-33); the union pin needs v2's `unk`, so the sheet carries
// every value while the node still paints the winning arm.
const unk = document.getElementById('target') !== null
// @ts-expect-error: intentional static-plus-spread collision — the union pin needs both spellings
el('target').className = css({ padding: '0', ...(unk ? { padding: '10px' } : { padding: '20px' }) })
