import { Reference } from '@reference-ui/types'

export const matrixReferenceMarker = 'reference-ui-matrix-reference'

function getRequestedSymbolName(): string {
  if (typeof window === 'undefined') return 'ReferenceApiFixture'

  const name = new URLSearchParams(window.location.search).get('name')?.trim()
  return name && name.length > 0 ? name : 'ReferenceApiFixture'
}

export function Index() {
  const name = getRequestedSymbolName()

  return (
    <main data-testid="reference-root">
      <h1>Reference UI reference matrix</h1>
      <p>
        Generated reference docs are rendered through the browser `Reference`
        {' '}
        component.
      </p>
      <p data-testid="reference-selected-name">{name}</p>
      <Reference name={name} />
    </main>
  )
}