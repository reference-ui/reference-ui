// Entry for the CORE-LAYERS-19 world. It takes the colour mode from the query string and stamps html
// data-color-mode before the first render, then renders an own `Div` control and acme's two components: `Badge`,
// whose styles are acme's own, and `Plain`, which the app styles with `bg="brand"`. The control paints the app's
// `brand` in the app's own scope, so a probe that differs from it isolates the token scope, not resolution.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'
import { Badge, Plain } from '@fixture/layers19'

function stampHtmlMode(): void {
  const mode = new URLSearchParams(window.location.search).get('mode')
  if (mode) document.documentElement.setAttribute('data-color-mode', mode)
}

function App() {
  return (
    <main>
      <Div id="app-control" bg="brand">
        app control
      </Div>
      <Badge id="acme-internal">acme internal</Badge>
      <Plain id="acme-app-prop" bg="brand">
        app prop on acme
      </Plain>
    </main>
  )
}

stampHtmlMode()
const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
