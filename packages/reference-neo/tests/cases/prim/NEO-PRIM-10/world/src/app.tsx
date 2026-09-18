// Entry for the PRIM-10 world. It takes the generated Div primitive and emits
// one styled probe so the sync loop mints runtime plans and the styled named
// graph. The surface proof runs node-side in the spec, not in the browser.
import { Div, createRoot } from '@reference-ui/react'

export function PrimSurface() {
  return (
    <Div color="brand" p="sm" id="surface-root">
      surface
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PrimSurface />)
