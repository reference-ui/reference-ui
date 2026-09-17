// Entry for the NEO-RECIPE-03 world. It takes the three probe nodes from the
// page and emits one recipe class string per node: an explicit true, an
// explicit false, and a bare call that falls back to the false default, so
// the spec can compare each boolean arm's paint.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const toggle = recipe({
  className: 'toggle',
  base: { color: 'ink' },
  variants: {
    active: {
      true: { display: 'block' },
      false: { display: 'none' },
    },
  },
  defaultVariants: { active: 'false' },
})

el('on').className = toggle({ active: true })
el('off').className = toggle({ active: false })
el('defaulted').className = toggle()
