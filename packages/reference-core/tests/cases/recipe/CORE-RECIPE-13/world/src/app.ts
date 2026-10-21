// Entry for the CORE-RECIPE-13 world. It takes the probe nodes from the page and paints one
// slotted card recipe onto every part: defaults, a loud large selection with a boolean axis, a
// runtime-picked size, a responsive size, a raw()-fed title and a splitVariantProps() title, so
// the spec can prove every slot resolves and paints from one call.
import { css, recipe } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(`missing #${id}`)
  return node
}

const card = recipe({
  className: 'card',
  slots: ['root', 'title', 'body'],
  base: {
    root: { display: 'flex', flexDirection: 'column', color: 'ink' },
    title: { fontWeight: '600' },
  },
  variants: {
    size: {
      sm: { root: { padding: '4px' }, title: { fontSize: '12px' } },
      lg: { root: { padding: '16px' }, title: { fontSize: '20px' } },
    },
    tone: {
      quiet: { root: { backgroundColor: 'paper' } },
      loud: { root: { backgroundColor: 'brand' }, title: { color: 'paper' } },
    },
    muted: { true: { body: { opacity: '0.5' } } },
  },
  defaultVariants: { size: 'sm', tone: 'quiet' },
  compoundVariants: [{ size: 'lg', tone: 'loud', css: { title: { letterSpacing: '2px' } } }],
})

type CardClasses = ReturnType<typeof card>

function paint(prefix: string, classes: CardClasses): void {
  el(`${prefix}-root`).className = classes.root
  el(`${prefix}-title`).className = classes.title
  el(`${prefix}-body`).className = classes.body
}

// A size read from the page: extraction sees a variable, so every size class ships.
const picked: 'sm' | 'lg' = document.body.dataset.size === 'sm' ? 'sm' : 'lg'

paint('defaults', card())
paint('loud', card({ size: 'lg', tone: 'loud', muted: true }))
paint('picked', card({ size: picked }))
paint('narrow', card({ size: { base: 'sm', md: 'lg' } }))
paint('wide', card({ size: { base: 'sm', md: 'lg' } }))

// Extraction cannot see through raw(), so this twin literal emits the utilities the raw-fed title resolves.
css({ fontWeight: '600', fontSize: '20px', color: 'paper', letterSpacing: '2px' })
el('rawfed').className = css(card.raw({ size: 'lg', tone: 'loud' }).title)

const [selection, rest] = card.splitVariantProps({ size: 'lg' as const, id: 'split' })
const split = el('split')
split.className = card(selection).title
split.dataset.rest = JSON.stringify(rest)
