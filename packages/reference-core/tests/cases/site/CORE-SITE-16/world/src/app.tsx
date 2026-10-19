// Entry for the CORE-SITE-16 world. It takes the page root and emits two
// namespaced panels: NS.Panel matches the configured NSPanel host so its
// style props compile as a host's, while Other.Panel has no host, so it
// lowers under own as project code and, being Div underneath, paints too.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'

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
