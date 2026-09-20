// Entry for the NEO-NAMER-02 world. It takes the probe nodes from the page
// and emits one css() class string per naming shape, so each element
// carries the exact list the compiler namer spelled for holes, responsive
// arrays, per-prop objects, conditions, important, and the macros.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('hole').className = css({ color: null, margin: undefined })
el('resp').className = css({ color: ['#111111', null, '#333333'] })
el('obj').className = css({ width: { base: '1r', md: '3r' } })
el('hover').className = css({ color: { base: '#111111', _hover: '#222222' } })
el('bp').className = css({ color: '#444444', md: { color: '#555555' } })
el('bang').className = css({ color: '#666666!' })
el('font').className = css({ font: 'sans' })
el('size').className = css({ size: '20px' })
el('border').className = css({ border: '3px solid red' })
el('radius').className = css({ borderTopRadius: '4px' })
el('flex').className = css({ flex: '1' })
