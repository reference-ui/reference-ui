// app.tsx — browser entry and extraction source for the NEO-TYPE-09 world. It
// takes the generated Div primitive and renders one toned blue panel, so the
// world is a real strict consumer whose colour attrs the compiler reads. The
// off-token negatives live in the spec's temp consumers, never in this file.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function StrictWorld() {
  return (
    <Div id="strict-root" bg="blue.500/medium" color="blue.500">
      strict
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<StrictWorld />)
