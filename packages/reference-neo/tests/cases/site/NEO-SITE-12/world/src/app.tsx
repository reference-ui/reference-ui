// Entry for the NEO-SITE-12 world. It takes the unlisted Random component
// plus one lowercase and one primitive div, and emits the anti-host trio:
// two probes that must never extract beside the control that must.
import { Div, createRoot } from '@reference-ui/react'
import { Random } from './Random.js'

export function Site() {
  return (
    <>
      <Random fontSize="12px" id="random" />
      <div id="lower" color="red">
        lower
      </div>
      <Div id="control" mt="8px">
        control
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Site />)
