// Entry for the NEO-SYNC-15 world. It takes the traced Card host beside the
// Random and Label negatives and emits the discovery trio: one site that
// must extract beside two probes that must stay silent.
import { createRoot } from '@reference-ui/react'
import { Card } from './Card.js'
import { Random } from './Random.js'
import { Label } from './Label.js'

export function Site() {
  return (
    <>
      <Card p="1r" id="card" />
      <Random color="red" id="random" />
      <Label text="label" id="label" />
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Site />)
