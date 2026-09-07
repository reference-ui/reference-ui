import * as React from 'react'
import { getBookEntries, getBookEntry } from './registry'
import { BookDecorator } from './decorator'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class RendererErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Book rendering error:', error, info)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: '24px', fontFamily: 'monospace', color: '#ef4444', background: '#18181b', minHeight: '100vh' }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Story Rendering Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#f87171' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '12px' }}>
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export function BookRenderer() {
  const initial = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search)

    // 1. Check legacy Cosmos parameter: ?fixture={"path":"...","name":"..."}
    const legacyFixture = params.get('fixture')
    if (legacyFixture) {
      try {
        const parsed = JSON.parse(legacyFixture)
        const pathPart = parsed.path || ''
        const fileName = pathPart.split('/').pop() || ''
        const cleanName = fileName.replace(/\.(book|fixture)\.[^.]+$/, '')
        return {
          bookId: cleanName,
          storyName: parsed.name || '',
          theme: (params.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
        }
      } catch {
        // ignore
      }
    }

    // 2. Modern Book params
    return {
      bookId: params.get('book') || '',
      storyName: params.get('story') || '',
      theme: (params.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
    }
  }, [])

  const [currentBookId, setCurrentBookId] = React.useState(initial.bookId)
  const [currentStoryName, setCurrentStoryName] = React.useState(initial.storyName)
  const [theme, setTheme] = React.useState<'dark' | 'light'>(initial.theme)
  const [hmrVersion, setHmrVersion] = React.useState(0)

  // Listen to Vite HMR afterUpdate events for instant hot reloading without full reload
  React.useEffect(() => {
    if (import.meta.hot) {
      const onHmrUpdate = (payload: any) => {
        console.log('[Book Renderer] HMR update detected:', payload?.updates)
        setHmrVersion(v => v + 1)
      }
      import.meta.hot.on('vite:afterUpdate', onHmrUpdate)
      return () => {
        import.meta.hot?.off('vite:afterUpdate', onHmrUpdate)
      }
    }
  }, [])

  // Fast synchronous bridge and postMessage listener
  React.useEffect(() => {
    ;(window as any).__BOOK_NAVIGATE__ = (bookId: string, storyName: string) => {
      if (bookId !== undefined) setCurrentBookId(bookId)
      if (storyName !== undefined) setCurrentStoryName(storyName)
    }
    ;(window as any).__BOOK_SET_THEME__ = (newTheme: 'dark' | 'light') => {
      setTheme(newTheme)
    }

    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'BOOK_NAVIGATE') {
        if (e.data.bookId !== undefined) setCurrentBookId(e.data.bookId)
        if (e.data.storyName !== undefined) setCurrentStoryName(e.data.storyName)
      } else if (e.data?.type === 'BOOK_SET_THEME' && (e.data.theme === 'dark' || e.data.theme === 'light')) {
        setTheme(e.data.theme)
      }
    }

    window.addEventListener('message', onMessage)

    // Notify parent frame that renderer is ready
    try {
      window.parent?.postMessage({ type: 'BOOK_RENDERER_READY' }, '*')
    } catch {
      // ignore
    }

    return () => {
      delete (window as any).__BOOK_NAVIGATE__
      delete (window as any).__BOOK_SET_THEME__
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const entry = getBookEntry(currentBookId) || getBookEntries()[0]

  if (!entry) {
    return (
      <div style={{ padding: '24px', fontFamily: 'monospace', color: '#ef4444', background: '#090d16', minHeight: '100vh' }}>
        <h3>No book found for "{currentBookId}"</h3>
      </div>
    )
  }

  const stories = entry.stories
  const activeStory = (currentStoryName ? stories.find(s => s.name.toLowerCase() === currentStoryName.toLowerCase()) : null) || stories[0]

  if (!activeStory) {
    return (
      <div style={{ padding: '24px', color: '#64748b', fontFamily: 'monospace', background: theme === 'dark' ? '#090d16' : '#f8fafc', minHeight: '100vh' }}>
        No stories available.
      </div>
    )
  }

  const ComponentToRender = activeStory.component

  return (
    <RendererErrorBoundary key={`${entry.id}_${activeStory.name}_${hmrVersion}`}>
      <BookDecorator theme={theme}>
        <ComponentToRender />
      </BookDecorator>
    </RendererErrorBoundary>
  )
}
