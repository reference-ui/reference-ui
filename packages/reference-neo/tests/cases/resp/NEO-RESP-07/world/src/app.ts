// app.ts — browser entry for the NEO-RESP-07 world. Takes the compiled
// css() runtime and emits the container macro onto one wrapper plus the
// responsive width class onto both probes. The twin subtree stays rootless.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const root = css({ container: true })
const cls = css({ width: ['50px', '60px'] })

el('rooted').className = root
el('rooted-probe').className = cls
el('unrooted-probe').className = cls
