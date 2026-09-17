// Entry for the NEO-SITE-07 world. It takes the brand binding from the
// sibling styles module and emits one css() class for the node, so the
// site value lives across the file boundary while the node still paints.
// The explicit .js extension is the browser's address for the built file;
// the extractor resolves the same binding from the scanned sources.
import { css } from '@reference-ui/react'
import { brand } from './styles.js'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('target').className = css({ color: brand })
