// Entry for the NEO-SITE-13 world. It takes the generated Div primitive
// and emits one valueless border attr plus a plain control, so the macro
// half paints on the probe while the control proves the default is bare.
import { Div, createRoot } from '@reference-ui/react'

export function Site() {
  return (
    <>
      <Div border id="probe" color="ink">
        bordered
      </Div>
      <Div id="control" color="ink">
        plain
      </Div>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Site />)
