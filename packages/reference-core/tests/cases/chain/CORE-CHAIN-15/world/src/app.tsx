// Entry for the CORE-CHAIN-15 world. It takes the three package import shapes (direct, barrel, `css` wrapper) and a local
// `Div` control, and emits them into #root. The control resolves the consumer-only token in the app's own scope, so a
// failing package probe beside a painted control isolates the miss to ownership, not to token resolution.
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'
import { Barrel } from './barrel.js'
import { Direct } from './direct.js'
import { Wrapped } from './wrapper.js'

function App() {
  return (
    <main>
      <Div id="chain15-local" color="chain15Ink">
        local control
      </Div>
      <Direct />
      <Barrel />
      <Wrapped />
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
