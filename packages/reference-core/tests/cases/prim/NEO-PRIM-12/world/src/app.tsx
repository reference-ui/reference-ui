// Entry for the NEO-PRIM-12 world. It takes the page root and emits one
// foreign-rendered Div: createRoot comes from react-dom/client (the
// consumer's copy) while Div comes from the generated entry, so the browser
// proves both sides share a single React dispatcher or the render throws.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function Prim() {
  return (
    <Div color="brand" p="sm" id="prim">
      prim
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)
