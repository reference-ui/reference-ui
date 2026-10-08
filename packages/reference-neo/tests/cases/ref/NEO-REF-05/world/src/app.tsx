// World entry: it renders the reference shell in one of three modes selected by the view query param.
// The default mode mirrors the matrix consumer shell; provider and no-provider exercise the context hook
// with and without its runtime, and the error boundary surfaces the provider-required throw as page text.
import { createRoot } from 'react-dom/client'
import { Component } from 'react'
import type { ReactNode } from 'react'
import {
  Reference,
  ReferenceRuntimeProvider,
  createDefaultReferenceRuntime,
  useReferenceDocumentFromContext,
} from '@world/types'

function getParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name)?.trim() ?? ''
}

interface BoundaryProps {
  children?: ReactNode
}

interface BoundaryState {
  message: string | null
}

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { message: null }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  render(): ReactNode {
    if (this.state.message !== null) {
      return <p data-testid="boundary-message">{this.state.message}</p>
    }
    return this.props.children
  }
}

function DocReader({ name }: { name: string }) {
  const { document, errorMessage, isLoading } = useReferenceDocumentFromContext(name)
  if (isLoading) return <p data-testid="reader-state">loading</p>
  if (errorMessage !== null) return <p data-testid="reader-state">error: {errorMessage}</p>
  if (document === null) return <p data-testid="reader-state">empty</p>
  return <p data-testid="reader-state">document: {document.name}</p>
}

export function Index() {
  const view = getParam('view')
  const rawName = getParam('name')
  const name = rawName.length > 0 ? rawName : 'ReferenceApiFixture'

  if (view === 'no-provider') {
    return (
      <main data-testid="reference-root">
        <h1>Reference UI reference matrix</h1>
        <ErrorBoundary>
          <DocReader name={name} />
        </ErrorBoundary>
      </main>
    )
  }

  if (view === 'provider') {
    return (
      <main data-testid="reference-root">
        <h1>Reference UI reference matrix</h1>
        <ReferenceRuntimeProvider runtime={createDefaultReferenceRuntime()}>
          <DocReader name={name} />
        </ReferenceRuntimeProvider>
      </main>
    )
  }

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
