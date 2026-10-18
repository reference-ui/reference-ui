// Entry for the NEO-SITE-04 world. It takes the css runtime through two
// binding shapes — an import alias and a namespace import — and emits one
// class string per node, so the extractor must treat both bindings as sites
// while each node paints its own color.
import { css as c } from '@reference-ui/react'
import * as ui from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('aliased').className = c({ color: 'cherry' })
el('namespaced').className = ui.css({ color: 'ocean' })
