// Entry for the NEO-SITE-10 world. It takes the generated Div primitive
// and emits two probes for the same style object: one through the css
// prop, one through a css() call. Extraction source and browser entry
// stay one file, so the compiler and the page can never drift apart.
import { Div, createRoot, css } from '@reference-ui/react'

const cls = css({ mt: '8px' })

export function Site() {
  return (
    <>
      <Div id="prop" css={{ mt: '8px' }}>
        css prop
      </Div>
      <div id="call" className={cls}>
        css call
      </div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Site />)
