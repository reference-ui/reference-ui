// app.ts — browser entry for the NEO-RESP-10 world. Takes the compiled
// css()/recipe() runtimes and emits the three contract classes onto their
// probes. The compiler extracts every literal call, so the width, height,
// and mixed branches all exist in the sheet before the browser resizes.
import { css, recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const viewportCss = css({
  padding: '0px',
  backgroundColor: 'transparent',
  '@media (min-width: 800px)': {
    padding: '24px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
  },
})

const viewportRecipe = recipe({
  className: 'viewport',
  base: {
    padding: '0px',
    backgroundColor: 'transparent',
    '@media (min-height: 700px)': {
      padding: '16px',
      backgroundColor: '#0f766e',
      color: '#ffffff',
    },
  },
})

const mixedCss = css({
  paddingTop: '0px',
  backgroundColor: 'transparent',
  borderTopStyle: 'solid',
  borderTopWidth: '0px',
  borderTopColor: 'transparent',
  r: {
    260: {
      paddingTop: '18px',
      backgroundColor: '#fef3c7',
    },
  },
  '@media (min-width: 800px)': {
    borderTopWidth: '6px',
    borderTopColor: '#ea580c',
  },
})

el('css-target').className = viewportCss
el('recipe-target').className = viewportRecipe()
el('mixed-target-narrow').className = mixedCss
el('mixed-target-wide').className = mixedCss
