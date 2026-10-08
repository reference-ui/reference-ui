// Entry for the NEO-SITE-20 world. It styles one node per css() arg wrap
// form (bare, parens, as const, satisfies, non-null, .ts angle-assertion),
// so every wrap paints exactly like the bare arg with zero diagnostics.
import { css, type CssStyles } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('bare').className = css({ color: 'cherry' })
el('paren').className = css(({ color: 'tangerine' }))
el('asconst').className = css({ color: 'amber' } as const)
el('satisfies').className = css({ color: 'forest' } satisfies { color: string })
el('nonnull').className = css({ color: 'ocean' }!)
el('asserted').className = css(<CssStyles>{ color: 'plum' })
