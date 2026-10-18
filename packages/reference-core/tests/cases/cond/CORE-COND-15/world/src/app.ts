// Entry for the COND-15 world. It takes the container macro plus the
// mixed and bogus classes and emits them onto the wide root, the narrow
// root, and the three probes, so the sheet nests one supports rule per arm.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const root = css({ container: true })
el('root').className = root
el('narrow').className = root

const mixed = css({
  color: 'ink',
  '@supports (display: grid)': { sm: { '&:hover': { color: 'brand' } } },
})
el('live').className = mixed
el('narrow-probe').className = mixed

el('bogus').className = css({
  color: 'ink',
  '@supports (display: bogus-magic)': { sm: { color: 'brand' } },
})
