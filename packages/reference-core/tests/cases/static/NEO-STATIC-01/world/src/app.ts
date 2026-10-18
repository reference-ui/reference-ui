// Entry for the NEO-STATIC-01 world. It takes the base and twin probes and
// paints each through a runtime value (a function parameter the extractor
// cannot see), so both classes resolve against the pre-generated static
// atoms rather than any authored call site.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

function paint(shade: string): string {
  return css({ color: shade })
}

function paintHover(shade: string): string {
  return css({ _hover: { color: shade } })
}

el('base').className = paint('ember')
el('twin').className = paintHover('gold')
