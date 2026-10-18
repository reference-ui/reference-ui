// Entry for the NEO-CSS-13 world. It takes the row node and its six flex
// items from the page and emits one css() class string per item, so each
// flex spelling from the RS-39 filing lands as its own compiled atom the
// way the live lib victims author it.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('row').className = css({ display: 'flex' })
el('one').className = css({ flex: '1' })
el('zero').className = css({ flex: '0 0 auto' })
el('auto').className = css({ flex: 'auto' })
el('initial').className = css({ flex: 'initial' })
el('none').className = css({ flex: 'none' })
el('grow').className = css({ flex: '2 30px' })
