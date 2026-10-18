// Entry for the NEO-LAYERS-04 world. It takes the css() runtime and emits the
// width class of the container probe: a container query that paints 60px inside
// a container-type ancestor and 50px outside one. The foreign probe is static
// markup in index.html, so no script paints it.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('container-probe').className = css({ width: ['50px', '60px'] })
