// Entry for the CORE-CHAIN-08 world. It takes the prebuilt package component
// fixture — a module built against its own materialized bound `react.mjs` —
// and styles it with a consumer-only token. `Badge` comes from an installed
// package that publishes its own system, so the value paints only when the
// consumer compile backs the prop under that system; otherwise the rendered
// class stays unbacked.
// The local `Div` control resolves the same token in the consumer's own scope,
// so a red badge beside a green control isolates the miss to the prebuilt path.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'
import { Badge } from '@fixture/prebuilt'

function App() {
  return (
    <main>
      <Div id="chain8-local" color="chain8Ink">
        local control
      </Div>
      <Badge color="chain8Ink" data-testid="chain8-badge">
        prebuilt badge
      </Badge>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
