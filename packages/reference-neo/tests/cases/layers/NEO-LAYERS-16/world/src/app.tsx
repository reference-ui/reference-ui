// app.tsx — browser entry for the NEO-LAYERS-16 world. It takes the generated Div primitive and
// renders one probe painted with the consumer's own strict token, so the world is a real strict
// consumer. The layer-only negatives live in the spec's temp consumers, never in this file.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function StrictProbe() {
  return (
    <Div id="strict-probe" color="consumerInk">
      strict probe
    </Div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<StrictProbe />)
