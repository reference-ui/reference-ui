// Entry for the CORE-CHAIN-17 app, apps/web. It takes Card from the workspace package `@acme/ui` and styles it three
// ways: `bg` with the app-only ink, the same ink through a same-file `css` wrapper, and `bg` with `shared`, a token the
// package defines too. A local `Div` control paints the ink in the app's own scope, so a failing Card beside it is an
// ownership miss, not a token miss. It emits them into #root.
import type { ReactElement, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Div } from '@reference-ui/react'
import { Card } from '@acme/ui'

const Panel = ({ css, children }: { css?: Record<string, string>; children?: ReactNode }): ReactElement => (
  <Card css={css} data-testid="chain17-panel">
    {children}
  </Card>
)

function App(): ReactElement {
  return (
    <main>
      <Div id="chain17-local" color="chain17Ink">
        local control
      </Div>
      <Card bg="chain17Ink" data-testid="chain17-card">
        card
      </Card>
      <Panel css={{ bg: 'chain17Ink' }}>panel</Panel>
      <Card bg="shared" data-testid="chain17-shared">
        shared token
      </Card>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<App />)
