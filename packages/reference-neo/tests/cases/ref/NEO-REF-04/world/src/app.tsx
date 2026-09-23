// World entry: it reads the requested symbol name from the query string and renders the reference page.
// It mirrors the matrix consumer shell (root testid, heading, selected-name marker, Reference component).
// The world build transpiles this to classic createElement calls; the importmap wires the generated bundles.
import { createRoot } from '@reference-ui/react'
import { Reference } from '@world/types'

function getRequestedSymbolName(): string {
  const name = new URLSearchParams(window.location.search).get('name')?.trim()
  return name && name.length > 0 ? name : 'ReferenceApiFixture'
}

export function Index() {
  const name = getRequestedSymbolName()

  return (
    <main data-testid="reference-root">
      <h1>Reference UI reference matrix</h1>
      <p>Generated reference docs are rendered through the browser Reference component.</p>
      <p data-testid="reference-selected-name">{name}</p>
      <Reference name={name} />
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<Index />)
