// Entry for the PRIM-01 world: paints the #root, #prim probes through the generated runtime. Takes
// the synced css bindings and emits the DOM the specs assert against.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

// Extraction source and browser entry in one: the compiler reads this file's
// JSX attrs to emit the style plans, and the harness transpiles it to dist/
// (classic createElement calls) for the browser. No twin file to drift.
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
