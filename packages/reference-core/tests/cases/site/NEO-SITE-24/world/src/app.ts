// Entry for the NEO-SITE-24 world. It styles the sibling node through a
// multi-arg call whose whole-object first arg lowers beside the live
// object arg that wins the merge; the logical node through an arg-level
// && whose object right lowers while the const-true left diagnoses; the
// spread node through the same const object with braces; and the tagged
// node through a live css tag (diagnoses, paints nothing).
import { css } from '@reference-ui/react'

const styles = { color: 'cherry' }
const cond = true

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('sibling').className = css(styles, { color: 'ocean' })
el('logical').className = css(cond && { color: 'plum' })
el('spread').className = css({ ...styles })
// @ts-expect-error: tagged css() is a diagnosed non-site — this call is intentionally mistyped
el('tagged').className = css`
  color: red;
`
