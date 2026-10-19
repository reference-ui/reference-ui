// Entry for the CORE-LAYERS-20 world. It takes the two prebuilt packages and renders a's Badge on its own, then b's
// Card holding another a Badge, the way b's components wrap a's. No probe carries an app style prop: every paint is
// a package's own `bg="brand"`, so each reading names whose `brand` value holds inside that package's element.
import { createRoot } from 'react-dom/client'
import { ABadge, BCard } from '@fixture/layers20'

function App() {
  return (
    <main>
      <ABadge id="a-direct">a direct</ABadge>
      <BCard id="b-card">
        <ABadge id="a-in-b">a inside b</ABadge>
      </BCard>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
