import * as React from 'react'
import { Div } from '@reference-ui/react'
import { BookDecorator } from '../decorator/BookDecorator'
import { overlayStackStore } from '../../src/components/Overlay/overlay-stack'
import { setBookErrorState, setStoryLoadMetrics, setBookUpdatingState } from '../perf/client'
import type { BookLoadedEntry, BookManifestEntry, ViewportPreset, ViewportConfig } from '../discovery/types'
import { loadStory } from '../discovery/loadStory'

export const VIEWPORT_CONFIGS: Record<ViewportPreset, ViewportConfig> = {
  full: { id: 'full', label: '100%', width: '100%', height: '100%' },
  mobile: { id: 'mobile', label: '375px', width: '375px', height: '667px' },
  tablet: { id: 'tablet', label: '768px', width: '768px', height: '1024px' },
  desktop: { id: 'desktop', label: '1200px', width: '1200px', height: '800px' },
}

interface CanvasErrorBoundaryProps {
  children: React.ReactNode
  storyKey: string
  onError?: (err: Error) => void
  onRecover?: () => void
}

interface CanvasErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class CanvasErrorBoundary extends React.Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Book] Story rendering error:', error, info)
    this.props.onError?.(error)
  }

  componentDidUpdate(prevProps: CanvasErrorBoundaryProps) {
    // Reset error when story identity changes
    if (this.state.hasError && prevProps.storyKey !== this.props.storyKey) {
      this.setState({ hasError: false, error: null })
      this.props.onRecover?.()
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <Div
          data-book-error="true"
          p="6r"
          fontFamily="mono"
          color="red.400"
          bg="gray.950"
          minH="100%"
          boxSizing="border-box"
        >
          <Div fontSize="3.5r" fontWeight="600" color="red.300" mb="3r">
            Story Rendering Error
          </Div>
          <Div whiteSpace="pre-wrap" wordBreak="break-word" color="red.200" mb="3r">
            {this.state.error.message}
          </Div>
          <Div fontSize="2.4r" color="gray.500" overflow="auto">
            {this.state.error.stack}
          </Div>
        </Div>
      )
    }
    return this.props.children
  }
}

export interface BookCanvasProps {
  entry: BookManifestEntry | undefined
  storyName: string
  theme: 'dark' | 'light'
  viewport: ViewportPreset
  onAvailableStories?: (stories: { name: string }[]) => void
}

export function BookCanvas({
  entry,
  storyName,
  theme,
  viewport,
  onAvailableStories,
}: BookCanvasProps) {
  const [loadedEntry, setLoadedEntry] = React.useState<BookLoadedEntry | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [hasError, setHasError] = React.useState<boolean>(false)

  const vpConfig = VIEWPORT_CONFIGS[viewport]
  const isFull = viewport === 'full'
  const isDark = theme === 'dark'

  // Clean up overlays and inert attributes ONLY when story identity changes (not on HMR)
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[data-overlay-managed-inert]').forEach(el => {
        el.removeAttribute('inert')
        el.removeAttribute('data-overlay-managed-inert')
      })
      overlayStackStore.getState().reset()
    }
  }, [entry?.id, storyName])

  // Lazy-load active story module
  React.useEffect(() => {
    if (!entry) {
      setLoadedEntry(null)
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)
    setBookUpdatingState('Loading story…')

    loadStory(entry)
      .then(loaded => {
        if (isCancelled) return
        setLoadedEntry(loaded)
        setIsLoading(false)
        setHasError(false)
        onAvailableStories?.(loaded.stories)
        setStoryLoadMetrics(loaded.loadTimeMs || 20)
      })
      .catch(err => {
        if (isCancelled) return
        setIsLoading(false)
        setHasError(true)
        setBookErrorState(err?.message || String(err))
      })

    return () => {
      isCancelled = true
    }
  }, [entry?.id, entry?.filePath])

  // Clear error on hot updates when code fixes the issue
  React.useEffect(() => {
    if (import.meta.hot) {
      const onHmrUpdate = () => {
        if (hasError && entry) {
          loadStory(entry)
            .then(loaded => {
              setLoadedEntry(loaded)
              setHasError(false)
              setStoryLoadMetrics(20)
            })
            .catch(() => {})
        }
      }
      import.meta.hot.on('vite:afterUpdate', onHmrUpdate)
      return () => {
        import.meta.hot?.off('vite:afterUpdate', onHmrUpdate)
      }
    }
  }, [hasError, entry])

  const stories = loadedEntry?.stories || []
  const activeStory = (storyName ? stories.find(s => s.name.toLowerCase() === storyName.toLowerCase()) : null) || stories[0]
  const ComponentToRender = activeStory?.component

  const readyState = hasError ? 'error' : isLoading ? 'updating' : 'live'

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-book-ready', readyState)
    }
  }, [readyState])

  const storyKey = `${entry?.id || ''}:${activeStory?.name || ''}`

  return (
    <Div
      data-book-canvas="true"
      data-book-ready={readyState}
      width={vpConfig.width}
      height={vpConfig.height}
      maxW="100%"
      maxH="100%"
      borderRadius={isFull ? 'none' : 'lg'}
      overflow="hidden"
      border={isFull ? 'none' : '1px solid'}
      borderColor={isDark ? 'gray.800' : 'gray.300'}
      boxShadow={isFull ? 'none' : '0 12px 40px rgba(0,0,0,0.3)'}
      display="flex"
      flexDirection="column"
      bg={isDark ? 'gray.950' : 'white'}
      transition="width 200ms ease, height 200ms ease"
    >
      {isLoading ? (
        <Div p="6r" color="design.text.light" fontSize="3.5r" fontFamily="mono">
          Loading story…
        </Div>
      ) : ComponentToRender ? (
        <CanvasErrorBoundary
          storyKey={storyKey}
          onError={err => {
            setHasError(true)
            setBookErrorState(err.message)
          }}
          onRecover={() => {
            setHasError(false)
          }}
        >
          <BookDecorator theme={theme} layout="story">
            <ComponentToRender />
          </BookDecorator>
        </CanvasErrorBoundary>
      ) : (
        <Div p="6r" color="design.text.light" fontSize="3.5r" fontFamily="mono">
          No story available to render.
        </Div>
      )}
    </Div>
  )
}
