import { Button, Div, createRoot, type DivProps, type StyleProps } from '@reference-ui/react'
import { css, recipe } from '@reference-ui/react'

// Extraction source and browser entry in one: the compiler reads this file's
// css()/recipe() calls and JSX attrs to emit plans and tables, and the harness
// transpiles it to dist/ for the browser. Everything imports from the generated
// react entry; the proof spec typechecks the same shape as an end-state consumer
// in a temp dir against the generated declarations. Browser-resolved wants stay
// bare literals: extraction mints runtime plans only for literal wants, so even
// `satisfies` stays out and the CssStyles/SystemStyleObject type story lives in
// the proof spec's end-state consumer.
const panelClass = css(
  { backgroundColor: 'paper', p: 'sm' },
  { color: 'brand' },
  // Mints the spread probe's (color, ink) plan; the panel color is unasserted.
  { color: 'ink' }
)

const button = recipe({
  className: 'button',
  base: { display: 'inline-flex' },
  variants: {
    tone: {
      accent: { color: 'brand' },
      muted: { color: 'paper' },
    },
    size: {
      sm: { p: 'sm' },
      lg: { p: 'lg' },
    },
  },
  defaultVariants: { tone: 'muted', size: 'sm' },
  compoundVariants: [{ tone: 'accent', size: 'lg', css: { backgroundColor: 'ink' } }],
})

const copy: StyleProps = { color: 'ink' }

export function TypeWorld(props: DivProps) {
  return (
    <Div color="brand" p="sm" id="type-root" {...props}>
      <Button className={button({ tone: 'accent', size: 'sm' })} id="type-recipe">
        recipe
      </Button>
      <span className={panelClass} id="type-css">
        css
      </span>
      <Div {...copy} id="type-copy">
        copy
      </Div>
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<TypeWorld />)
