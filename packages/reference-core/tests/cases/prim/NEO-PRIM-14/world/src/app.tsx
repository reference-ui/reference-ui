// app.tsx — browser entry for the NEO-PRIM-14 world. Takes the page root
// and emits the light host with its token probe and in-tree dark island,
// then a second root into a body-level host carrying the portaled island.
// The portaled child inherits dark through island context — the same React
// context a createPortal preserves — while detached from the host's DOM.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

export function Prim() {
  return (
    <div id="light-host" data-color-mode="light">
      <Div id="host-token" color="island">
        Light host token
      </Div>
      <Div id="in-tree-island" colorMode="dark">
        <Div id="in-tree-token" color="island">
          In-tree dark token
        </Div>
      </Div>
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Prim />)

const portalHost = document.createElement('div')
portalHost.id = 'portal-host'
document.body.appendChild(portalHost)
createRoot(portalHost).render(
  <Div id="portal-island" colorMode="dark">
    <Div id="portal-child" color="island">
      Portal dark island child
    </Div>
  </Div>,
)
