// Entry for the NEO-STATIC-02 world. It takes the three probes and paints
// the control through a static want that overlaps the wildcard plus two
// probes through runtime values, so the spec can prove the expansion
// covers every leaf while the overlap mints no duplicate.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

function paint(shade: string): string {
  return css({ color: shade })
}

el('control').className = css({ color: 'n100' })
el('dyn').className = paint('n200')
el('dyn2').className = paint('n300')
