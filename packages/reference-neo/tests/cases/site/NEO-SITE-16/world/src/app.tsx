// Entry for the NEO-SITE-16 world. It takes the page root and emits two
// namespaced panels: NS.Panel matches the configured NSPanel host so its
// style props compile, while Other.Panel has no host so its backdrop stays
// uncompiled and the browser proves the gate by painting nothing.
import { Div, createRoot } from '@reference-ui/react'

const NS = { Panel: Div }
const Other = { Panel: Div }

function App() {
  return (
    <>
      <NS.Panel color="brand" p="sm" id="member">
        member panel
      </NS.Panel>
      <Other.Panel bg="paper" id="twin">
        twin panel
      </Other.Panel>
    </>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
