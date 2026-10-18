// Entry for the NEO-NAMER-02 world. It takes the probe nodes from the page
// and emits one css() class string per naming shape, so each element carries
// the exact list the static namer spelled for holes, responsive arrays,
// per-prop objects, conditions, important, the macros, and the bare-weight
// family-scoping seam the runtime shared with the compiler. Every weight
// call site is a literal so the extractor can author its scoped want.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

el('hole').className = css({ color: null, margin: undefined })
el('resp').className = css({ color: ['#111111', null, '#333333'] })
el('obj').className = css({ width: { base: '1r', md: '3r' } })
el('hover').className = css({ color: { base: '#111111', _hover: '#222222' } })
el('bp').className = css({ color: '#444444', md: { color: '#555555' } })
el('bang').className = css({ color: '#666666!' })
el('font').className = css({ font: 'sans' })
el('size').className = css({ size: '20px' })
el('border').className = css({ border: '3px solid red' })
el('radius').className = css({ borderTopRadius: '4px' })
el('flex').className = css({ flex: '1' })

// Bare-weight seam: every family × keyword pair scopes to the family scale.
el('f-sans-thin').className = css({ fontFamily: 'sans', weight: 'thin' })
el('f-sans-light').className = css({ fontFamily: 'sans', weight: 'light' })
el('f-sans-normal').className = css({ fontFamily: 'sans', weight: 'normal' })
el('f-sans-semibold').className = css({ fontFamily: 'sans', weight: 'semibold' })
el('f-sans-bold').className = css({ fontFamily: 'sans', weight: 'bold' })
el('f-sans-black').className = css({ fontFamily: 'sans', weight: 'black' })
el('f-serif-thin').className = css({ fontFamily: 'serif', weight: 'thin' })
el('f-serif-light').className = css({ fontFamily: 'serif', weight: 'light' })
el('f-serif-normal').className = css({ fontFamily: 'serif', weight: 'normal' })
el('f-serif-semibold').className = css({ fontFamily: 'serif', weight: 'semibold' })
el('f-serif-bold').className = css({ fontFamily: 'serif', weight: 'bold' })
el('f-serif-black').className = css({ fontFamily: 'serif', weight: 'black' })
el('f-mono-thin').className = css({ fontFamily: 'mono', weight: 'thin' })
el('f-mono-light').className = css({ fontFamily: 'mono', weight: 'light' })
el('f-mono-normal').className = css({ fontFamily: 'mono', weight: 'normal' })
el('f-mono-semibold').className = css({ fontFamily: 'mono', weight: 'semibold' })
el('f-mono-bold').className = css({ fontFamily: 'mono', weight: 'bold' })
el('f-mono-black').className = css({ fontFamily: 'mono', weight: 'black' })

// Lone keyword weights keep the CSS keyword when no family seeds the scope.
el('lw-thin').className = css({ weight: 'thin' })
el('lw-light').className = css({ weight: 'light' })
el('lw-normal').className = css({ weight: 'normal' })
el('lw-semibold').className = css({ weight: 'semibold' })
el('lw-bold').className = css({ weight: 'bold' })
el('lw-black').className = css({ weight: 'black' })

// Two families decline to guess: `serif`+`mono` keeps the keyword 400, while
// a first-family or last-family bug would spell 373 or 393.
el('w-conflict').className = css({ fontFamily: 'serif' }, { fontFamily: 'mono', weight: 'normal' })

// A conditional weight falls back to the base family; a same-condition font
// beats it. Both use discriminating scale values (373) over the keyword.
el('w-hover-fallback').className = css({ fontFamily: 'serif', _hover: { weight: 'normal' } })
el('w-hover-group').className = css({
  fontFamily: 'sans',
  _hover: { fontFamily: 'serif', weight: 'normal' },
})

// Dynamic boundary (F2/O5): the runtime scopes the variable-held keyword,
// while the static pass cannot read the value and authors no weight want.
// Both reads are DOM member lookups, so the extractor folds no literal.
const dynamicWeight =
  document.body.dataset.dynamicWeight ?? document.body.dataset.fallbackWeight ?? ''
el('w-dynamic').className = css({ fontFamily: 'display', weight: dynamicWeight })

// F3 interim (KNOWN-DIVERGENT): responsive weight values stay keyword-scoped
// at runtime; the static pass fans them out before scoping.
el('w-f3-array').className = css({ fontFamily: 'sans', weight: ['thin'] })
el('w-f3-obj').className = css({ fontFamily: { base: 'sans' }, weight: { base: 'thin' } })
el('w-f3-font').className = css({ font: { base: 'sans' }, weight: 'thin' })
