// app.tsx — browser entry for the NEO-PRIM-13 world. Takes the page root
// and emits two probes: the category-prefixed target and its
// bare-spelling control. The compiler extracts both spellings literally, so
// each side resolves through the same token entries at build time.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function Prim() {
  return (
    <>
      <Div
        id="prefixed"
        color="colors.red.600"
        backgroundColor="colors.yellow.100"
        borderColor="colors.blue.600"
        borderStyle="solid"
        borderWidth="2px"
      >
        Category prefix tokens
      </Div>
      <Div
        id="bare"
        color="red.600"
        backgroundColor="yellow.100"
        borderColor="blue.600"
        borderStyle="solid"
        borderWidth="2px"
      >
        Bare tokens
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
