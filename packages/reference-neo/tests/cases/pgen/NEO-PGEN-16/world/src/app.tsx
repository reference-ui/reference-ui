// app.tsx — browser entry and extraction source for the NEO-PGEN-16 world.
// It takes the generated css() entry and emits a brand root plus an ink
// panel, using only color tokens and raw literals. The PGEN type specs prove
// E4 consumers in temp dirs; this world only carries the sync that publishes
// the narrow styled declarations those consumers compose with.
import { createRoot } from 'react-dom/client'
import { css } from '@reference-ui/react'

// Extraction source and browser entry in one: the compiler reads this file's
// css() calls to emit plans, and the harness transpiles it to dist/ for the
// browser. Browser-resolved wants stay bare literals: extraction mints
// runtime plans only for literal wants.
const rootClass = css({ color: 'brand', display: 'flex', flexDirection: 'column' })
const panelClass = css({ color: 'ink', backgroundColor: 'paper' })

export function TypeWorld() {
  return (
    <div id="type-root" className={rootClass}>
      <span id="type-panel" className={panelClass}>
        panel
      </span>
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<TypeWorld />)
