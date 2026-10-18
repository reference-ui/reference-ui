// Entry for the NEO-SITE-26 world. It styles the folded node through a
// const-member template part, the sized node through a const-number part
// with a unit quasi, the fan node through a const-ternary part that mints
// both arm utilities while the runtime paints the live one, and the
// refused node through a dynamic part that diagnoses while its static
// background sibling paints.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const o = { shade: 'cherry' }
el('folded').className = css({ color: `${o.shade}` })

const n = 4
el('sized').className = css({ width: `${n}px` })

const pick = document.title === 'site-26-open'
const tone = pick ? 'ocean' : 'plum'
el('fan').className = css({ color: `${tone}` })

const dyn = document.title
el('refused').className = css({ color: `${dyn}`, backgroundColor: 'ocean' })
