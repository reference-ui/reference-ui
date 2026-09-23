// app.ts — browser entry for the NEO-RECIPE-12 world. Takes the compiled
// recipe() runtime and emits one shared alert class onto both probes. The
// compiler extracts the literal recipe, so both query branches exist in the
// sheet before the browser sizes any viewport.
import { recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const card = recipe({
  className: 'responsive-card',
  base: {
    paddingTop: '0px',
    backgroundColor: 'transparent',
    borderTopStyle: 'solid',
    borderTopWidth: '0px',
    borderTopColor: 'transparent',
    '@container (min-width: 320px)': {
      borderTopWidth: '7px',
      borderTopColor: 'containerBorder',
    },
  },
  variants: {
    tone: {
      calm: {},
      alert: {
        '@media (min-width: 900px)': {
          paddingTop: '20px',
          backgroundColor: 'viewportBackground',
        },
      },
    },
  },
  defaultVariants: { tone: 'calm' },
})

const cls = card({ tone: 'alert' })

el('target-narrow').className = cls
el('target-wide').className = cls
