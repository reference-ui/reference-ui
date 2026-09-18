// Entry for the NEO-SITE-02 world. It takes the probe node from the page
// and emits one css() class whose color arrives through a member access
// on a local const style object, the way authors group related values.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const theme = { primary: 'cherry' }

el('target').className = css({ color: theme.primary })
