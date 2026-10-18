// Entry for the NEO-LAYERS-13 world. It takes the container root and the own rules the probes
// rank against the layer: a base colour, a dark-mode colour and a wide-container colour. Each
// own css() call lands on the probe that names its rank, so own, layer and extends meet there.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('root').className = css({ container: true })
el('dark-own-base').className += ` ${css({ color: '#15803d' })}`
el('dark-own-dark').className += ` ${css({ _dark: { color: '#7c3aed' } })}`
el('wide-own-base').className += ` ${css({ color: '#15803d' })}`
el('wide-own-sm').className += ` ${css({ sm: { color: '#dc2626' } })}`
