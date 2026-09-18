// Entry for the NEO-SITE-27 world. It styles the shadow node through a
// Card param named `color` while `src/styles.ts` exports a const of the
// same name, so the param must shadow the const: no class, one warning.
// The twin node styles through the unshadowed `accent` binding and paints.
import { css } from '@reference-ui/react'
import { accent } from './styles.js'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

function Card({ color }: { color: string }): string {
  el('shadow').className = css({ color })
  return color
}

Card({ color: 'cherry' })

el('twin').className = css({ color: accent })
