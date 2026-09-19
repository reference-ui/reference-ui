// Entry for the NEO-SITE-23 world. It styles four probe nodes from the
// Overmatch Ph3 fold slice — folded element reads and computed keys,
// flattened value-array and merge-list spreads — plus one refused dynamic
// index beside a static sibling, so the browser proves what the extractor
// folded and what it fail-closed.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const colors: Record<string, string> = { red: 'red', blue: 'blue' }
const k = 'blue'
const sizes = ['4px', '8px']
const pad = 'padding'

el('target').className = css({
  color: colors[k],
  backgroundColor: colors['red'],
  margin: sizes[1],
  [pad]: '12px',
})

el('flat').className = css({ padding: ['1px', ...['2px', '3px'], '4px'] })

el('merge').className = css([{ color: 'green' }, ...[{ color: 'pink' }]])

const params = new URLSearchParams(window.location.search)
const dk = params.get('c') as string
el('refused').className = css({ color: colors[dk], margin: '6px' })
