// Entry for the NEO-SITE-25 world. It styles six probe nodes from the
// Overmatch Ph3 binary-fold slice — folded arithmetic and string concat,
// all-literal short-circuit winners, folded ternary tests with dead arms,
// and multi-hop member reads — plus one refused bitwise position beside a
// static sibling, so the browser proves what the fold table folded, what
// the dead arms withheld, and what the refusal fail-closed.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const n = 4
const one = 1
const dark = true
const tokens = { colors: { red: '#f00', deep: { ink: 'purple' } }, gap: 2 }
const truthyText: string = 'x'
const emptyText: string = ''
const present: string | null = 'red'

el('arith').className = css({
  order: 2 + 3,
  zIndex: n * 2,
  width: 1 + 'px',
  margin: n + 'px',
})

el('logic').className = css({
  color: truthyText && 'red',
  backgroundColor: emptyText || 'blue',
})

el('nullish').className = css({
  color: (!dark ? 'x' : null) ?? 'teal',
  backgroundColor: present ?? 'unused',
})

el('compare').className = css({
  color: one === 1 ? 'white' : 'black',
  backgroundColor: dark ? 'red' : 'blue',
  padding: n + n === 8 ? '1px' : '2px',
})

el('member').className = css({
  color: tokens.colors.red,
  backgroundColor: tokens.colors.deep.ink,
  order: tokens.gap,
})

el('refused').className = css({ order: 5 | 3, margin: '6px' })
