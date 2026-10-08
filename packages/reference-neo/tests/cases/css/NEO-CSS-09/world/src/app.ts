// Entry for the NEO-CSS-09 world. It takes seven probe nodes from the page
// and emits one css() class string per escaping shape, so each probe carries
// the utility whose selector escapes dots, slashes, brackets, parens,
// percent, quotes, or commas the way a lib author writes them.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('dots').className = css({ marginTop: '1.5rem' })
el('pct').className = css({ width: '50%' })
el('calc').className = css({ padding: 'calc(100% - 1rem)' })
el('slash').className = css({ aspectRatio: '16 / 9' })
el('quotes').className = css({ fontFamily: '"Inter", sans-serif' })
el('brackets').className = css({ content: '"[a]"' })
el('commas').className = css({ boxShadow: '1px 1px red, 2px 2px blue' })
