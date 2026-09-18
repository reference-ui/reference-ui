// Entry for the PRIM-06 world. It takes the generated Div primitive and emits
// three style-free twins: a plain Div, a variant Div, and a colorMode Div.
// Nothing here should mint a utility; the variant paints through the global
// tag recipe alone.
import { Div, createRoot } from '@reference-ui/react'

export function Prim() {
  return (
    <>
      <Div id="plain">plain</Div>
      <Div id="accent" variant="accent">
        accent
      </Div>
      <Div id="dark" colorMode="dark">
        dark
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
