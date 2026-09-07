import * as React from 'react'
import {
  Div,
  Span,
  Aside,
  Header,
  Nav,
  Main,
  Button,
  Input,
} from '@reference-ui/react'
import { getBookEntries, getBookEntry, groupEntriesByCategory } from './registry'
import { BookDecorator } from './decorator'
import type { BookEntry, BookStory, ViewportPreset, ViewportConfig } from './types'

const VIEWPORT_CONFIGS: Record<ViewportPreset, ViewportConfig> = {
  full: { id: 'full', label: '100%', width: '100%', height: '100%' },
  mobile: { id: 'mobile', label: '375px', width: '375px', height: '667px' },
  tablet: { id: 'tablet', label: '768px', width: '768px', height: '1024px' },
  desktop: { id: 'desktop', label: '1200px', width: '1200px', height: '800px' },
}

export function BookShell() {
  const [hmrVersion, setHmrVersion] = React.useState(0)

  // Listen to Vite HMR updates
  React.useEffect(() => {
    if (import.meta.hot) {
      const onHmrUpdate = () => {
        setHmrVersion(v => v + 1)
      }
      import.meta.hot.on('vite:afterUpdate', onHmrUpdate)
      return () => {
        import.meta.hot?.off('vite:afterUpdate', onHmrUpdate)
      }
    }
  }, [])

  const allEntries = React.useMemo(() => getBookEntries(), [hmrVersion])

  // Initial params
  const initialParams = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      book: params.get('book') || allEntries[0]?.id || '',
      story: params.get('story') || '',
      theme: (params.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
      direct: params.get('direct') === 'true',
    }
  }, [allEntries])

  const [selectedBookId, setSelectedBookId] = React.useState<string>(initialParams.book)
  const [selectedStoryName, setSelectedStoryName] = React.useState<string>(initialParams.story)
  const [theme, setTheme] = React.useState<'dark' | 'light'>(initialParams.theme)
  const [viewport, setViewport] = React.useState<ViewportPreset>('full')
  const [canvasMode, setCanvasMode] = React.useState<'iframe' | 'direct'>(initialParams.direct ? 'direct' : 'iframe')
  const [search, setSearch] = React.useState('')

  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const isDark = theme === 'dark'
  const subtleBorder = isDark ? 'gray.800' : 'gray.200'

  // Current active entry
  const currentEntry = React.useMemo(() => {
    return getBookEntry(selectedBookId) || allEntries[0]
  }, [selectedBookId, allEntries])

  const activeStories = currentEntry?.stories || []

  // Ensure selected story is valid for current entry
  React.useEffect(() => {
    if (activeStories.length > 0) {
      const match = activeStories.find(s => s.name.toLowerCase() === selectedStoryName.toLowerCase())
      if (!match) {
        setSelectedStoryName(activeStories[0].name)
      }
    }
  }, [currentEntry?.id, activeStories, selectedStoryName])

  // Sync browser URL
  React.useEffect(() => {
    if (!currentEntry) return
    const url = new URL(window.location.href)
    url.searchParams.set('book', currentEntry.id)
    if (selectedStoryName) {
      url.searchParams.set('story', selectedStoryName)
    } else {
      url.searchParams.delete('story')
    }
    url.searchParams.set('theme', theme)
    if (canvasMode === 'direct') {
      url.searchParams.set('direct', 'true')
    } else {
      url.searchParams.delete('direct')
    }
    window.history.replaceState({}, '', url.toString())
  }, [currentEntry, selectedStoryName, theme, canvasMode])

  // Initial Iframe URL
  const initialIframeSrc = React.useRef(() => {
    const params = new URLSearchParams()
    params.set('renderer', 'true')
    params.set('book', initialParams.book)
    if (initialParams.story) {
      params.set('story', initialParams.story)
    }
    params.set('theme', initialParams.theme)
    return `/?${params.toString()}`
  }).current()

  // Instant iframe communication
  const dispatchToIframe = React.useCallback((bookId: string, storyName: string, activeTheme: 'dark' | 'light') => {
    if (!iframeRef.current?.contentWindow) return
    const win = iframeRef.current.contentWindow as any
    if (typeof win.__BOOK_NAVIGATE__ === 'function') {
      win.__BOOK_NAVIGATE__(bookId, storyName)
      win.__BOOK_SET_THEME__?.(activeTheme)
    } else {
      win.postMessage({ type: 'BOOK_NAVIGATE', bookId, storyName }, '*')
      win.postMessage({ type: 'BOOK_SET_THEME', theme: activeTheme }, '*')
    }
  }, [])

  React.useEffect(() => {
    if (canvasMode === 'iframe' && currentEntry) {
      dispatchToIframe(currentEntry.id, selectedStoryName, theme)
    }
  }, [currentEntry?.id, selectedStoryName, theme, canvasMode, dispatchToIframe])

  React.useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'BOOK_RENDERER_READY' && currentEntry) {
        dispatchToIframe(currentEntry.id, selectedStoryName, theme)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [currentEntry, selectedStoryName, theme, dispatchToIframe])

  // Global '/' keyboard shortcut to focus search
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearch('')
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Filtered categories
  const filteredCategories = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groupEntriesByCategory(allEntries)

    const matching = allEntries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.stories.some(s => s.name.toLowerCase().includes(q))
    )
    return groupEntriesByCategory(matching)
  }, [allEntries, search])

  const activeStory = React.useMemo(() => {
    return (selectedStoryName ? activeStories.find(s => s.name.toLowerCase() === selectedStoryName.toLowerCase()) : null) || activeStories[0]
  }, [activeStories, selectedStoryName])

  const ActiveStoryComponent = activeStory?.component || null
  const vpConfig = VIEWPORT_CONFIGS[viewport]
  const isFull = viewport === 'full'

  return (
    <BookDecorator theme={theme} layout="shell">
      {/* Sidebar */}
      <Aside
        width="62r"
        minW="62r"
        display="flex"
        flexDirection="column"
        borderRight="1px solid"
        borderRightColor={subtleBorder}
        bg={isDark ? 'gray.950' : 'gray.50'}
        zIndex={10}
      >
        {/* Sidebar Header */}
        <Header
          height="12r"
          px="3.5r"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          borderBottom="1px solid"
          borderBottomColor={subtleBorder}
        >
          <Div display="flex" alignItems="center" gap="2r">
            <Span fontSize="3.8r" fontWeight="700" letterSpacing="-0.02em" color="design.text.base">
              Book
            </Span>
            <Span
              fontSize="2.2r"
              px="1.5r"
              py="0.2r"
              borderRadius="sm"
              bg={isDark ? 'gray.800' : 'gray.200'}
              color={isDark ? 'gray.300' : 'gray.700'}
              fontWeight="600"
            >
              v0.1
            </Span>
          </Div>

          {/* Theme Toggle Button: clean ghost button without harsh border */}
          <Button
            type="button"
            variant="ghost"
            p="1.5r"
            borderRadius="sm"
            border="none"
            cursor="pointer"
            fontSize="3r"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            _hover={{ bg: isDark ? 'gray.800' : 'gray.200' }}
          >
            {isDark ? '☀️' : '🌙'}
          </Button>
        </Header>

        {/* Search Bar: subtle background and border */}
        <Div p="3r" borderBottom="1px solid" borderBottomColor={subtleBorder}>
          <Input
            ref={searchInputRef}
            placeholder="Search components... (/)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            width="100%"
            px="2.5r"
            py="1.5r"
            fontSize="2.8r"
            borderRadius="sm"
            border="1px solid"
            borderColor={isDark ? 'gray.800' : 'gray.300'}
            bg={isDark ? 'gray.900' : 'white'}
            color="design.text.base"
            outline="none"
            _focus={{ borderColor: 'ui.focus.ring' }}
          />
        </Div>

        {/* Navigation Tree */}
        <Nav flex="1" overflowY="auto" p="2r" display="flex" flexDirection="column" gap="3.5r">
          {filteredCategories.length === 0 ? (
            <Div p="4r" textAlign="center" color="design.text.light" fontSize="2.8r">
              No components found matching "{search}"
            </Div>
          ) : (
            filteredCategories.map(cat => (
              <Div key={cat.name} display="flex" flexDirection="column" gap="0.5r">
                {/* Category Header */}
                <Span
                  fontSize="2.4r"
                  fontWeight="600"
                  color="design.text.lighter"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  px="2.5r"
                  py="0.8r"
                >
                  {cat.name}
                </Span>

                <Div display="flex" flexDirection="column" gap="0.5r">
                  {cat.entries.map(entry => {
                    const isSelected = currentEntry?.id === entry.id
                    const hasMultipleStories = entry.stories.length > 1

                    return (
                      <Div key={entry.id} display="flex" flexDirection="column">
                        {/* Component Entry Button: Left-aligned with subtle hover */}
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBookId(entry.id)
                            setSelectedStoryName(entry.stories[0]?.name || '')
                          }}
                          width="100%"
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          px="2.5r"
                          py="1.8r"
                          borderRadius="sm"
                          border="none"
                          cursor="pointer"
                          bg={isSelected ? (isDark ? 'gray.800' : 'gray.200') : 'transparent'}
                          color={isSelected ? 'design.text.base' : 'design.text.light'}
                          fontWeight={isSelected ? '600' : 'normal'}
                          _hover={{
                            bg: isSelected ? undefined : (isDark ? 'gray.900' : 'gray.100'),
                            color: 'design.text.base',
                          }}
                          transition="background 100ms ease, color 100ms ease"
                        >
                          <Span fontSize="3r" textAlign="left">{entry.title}</Span>
                          {hasMultipleStories && (
                            <Span
                              fontSize="2.2r"
                              px="1.2r"
                              py="0.2r"
                              borderRadius="sm"
                              bg={isDark ? 'gray.800' : 'gray.300'}
                              color="design.text.light"
                              fontWeight="600"
                            >
                              {entry.stories.length}
                            </Span>
                          )}
                        </Button>

                        {/* Indented Stories: Left-aligned text, no centering, clear active state */}
                        {isSelected && hasMultipleStories && (
                          <Div
                            pl="3r"
                            ml="2r"
                            my="0.8r"
                            display="flex"
                            flexDirection="column"
                            gap="0.5r"
                            borderLeft="2px solid"
                            borderLeftColor={isDark ? 'gray.800' : 'gray.200'}
                          >
                            {entry.stories.map(story => {
                              const isStoryActive = (selectedStoryName || entry.stories[0]?.name).toLowerCase() === story.name.toLowerCase()
                              return (
                                <Button
                                  key={story.name}
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setSelectedStoryName(story.name)}
                                  width="100%"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="flex-start"
                                  px="2.5r"
                                  py="1.2r"
                                  borderRadius="sm"
                                  border="none"
                                  cursor="pointer"
                                  bg={isStoryActive ? (isDark ? 'gray.800' : 'gray.200') : 'transparent'}
                                  color={isStoryActive ? 'design.text.base' : 'design.text.light'}
                                  fontWeight={isStoryActive ? '600' : 'normal'}
                                  _hover={{
                                    bg: isStoryActive ? undefined : (isDark ? 'gray.900' : 'gray.100'),
                                    color: 'design.text.base',
                                  }}
                                  transition="background 100ms ease, color 100ms ease"
                                >
                                  <Span fontSize="2.8r" textAlign="left">
                                    {story.name}
                                  </Span>
                                </Button>
                              )
                            })}
                          </Div>
                        )}
                      </Div>
                    )
                  })}
                </Div>
              </Div>
            ))
          )}
        </Nav>
      </Aside>

      {/* Canvas Area */}
      <Div flex="1" display="flex" flexDirection="column" height="100%" overflow="hidden" bg={isDark ? 'gray.950' : 'gray.100'}>
        {/* Top Control Bar: clean subtle border without bright wireframe outlines */}
        <Header
          height="12r"
          px="4r"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          borderBottom="1px solid"
          borderBottomColor={subtleBorder}
          bg={isDark ? 'gray.950' : 'white'}
          flexShrink={0}
        >
          {/* Breadcrumbs */}
          <Div display="flex" alignItems="center" gap="1.5r">
            <Span fontSize="3.2r" color="design.text.light">
              {currentEntry?.category || 'Components'}
            </Span>
            <Span fontSize="3.2r" color="design.text.lighter">
              /
            </Span>
            <Span fontSize="3.2r" fontWeight="600" color="design.text.base">
              {currentEntry?.title}
            </Span>
            {activeStories.length > 1 && (
              <>
                <Span fontSize="3.2r" color="design.text.lighter">
                  /
                </Span>
                <Span fontSize="3.2r" color="design.text.base" fontWeight="500">
                  {selectedStoryName || activeStories[0]?.name}
                </Span>
              </>
            )}
          </Div>

          {/* Controls: Segmented Pills with NO harsh borders */}
          <Div display="flex" alignItems="center" gap="2.5r">
            {/* Viewport Presets Pill */}
            <Div
              display="flex"
              borderRadius="sm"
              p="0.5r"
              bg={isDark ? 'gray.900' : 'gray.200'}
              gap="0.5r"
            >
              {(['full', 'mobile', 'tablet', 'desktop'] as ViewportPreset[]).map(vp => (
                <Button
                  key={vp}
                  type="button"
                  variant="ghost"
                  px="2r"
                  py="0.8r"
                  fontSize="2.5r"
                  borderRadius="sm"
                  border="none"
                  cursor="pointer"
                  bg={viewport === vp ? (isDark ? 'gray.800' : 'white') : 'transparent'}
                  color={viewport === vp ? 'design.text.base' : 'design.text.light'}
                  fontWeight={viewport === vp ? '600' : 'normal'}
                  onClick={() => setViewport(vp)}
                  _hover={{
                    bg: viewport === vp ? undefined : (isDark ? 'gray.800' : 'gray.100'),
                  }}
                >
                  {VIEWPORT_CONFIGS[vp].label}
                </Button>
              ))}
            </Div>

            {/* Direct vs Iframe Switcher Pill */}
            <Div
              display="flex"
              borderRadius="sm"
              p="0.5r"
              bg={isDark ? 'gray.900' : 'gray.200'}
              gap="0.5r"
            >
              <Button
                type="button"
                variant="ghost"
                px="2r"
                py="0.8r"
                fontSize="2.5r"
                borderRadius="sm"
                border="none"
                cursor="pointer"
                bg={canvasMode === 'direct' ? (isDark ? 'gray.800' : 'white') : 'transparent'}
                color={canvasMode === 'direct' ? 'design.text.base' : 'design.text.light'}
                fontWeight={canvasMode === 'direct' ? '600' : 'normal'}
                onClick={() => setCanvasMode('direct')}
                title="Direct React render (instantaneous, fastest HMR)"
                _hover={{
                  bg: canvasMode === 'direct' ? undefined : (isDark ? 'gray.800' : 'gray.100'),
                }}
              >
                ⚡️ Direct
              </Button>
              <Button
                type="button"
                variant="ghost"
                px="2r"
                py="0.8r"
                fontSize="2.5r"
                borderRadius="sm"
                border="none"
                cursor="pointer"
                bg={canvasMode === 'iframe' ? (isDark ? 'gray.800' : 'white') : 'transparent'}
                color={canvasMode === 'iframe' ? 'design.text.base' : 'design.text.light'}
                fontWeight={canvasMode === 'iframe' ? '600' : 'normal'}
                onClick={() => setCanvasMode('iframe')}
                title="Iframe isolated render (CSS sandbox)"
                _hover={{
                  bg: canvasMode === 'iframe' ? undefined : (isDark ? 'gray.800' : 'gray.100'),
                }}
              >
                🖼 Iframe
              </Button>
            </Div>
          </Div>
        </Header>

        {/* Main Canvas Viewport */}
        <Main
          flex="1"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="auto"
          p={isFull ? '0' : '4r'}
          bg={isDark ? 'gray.950' : 'gray.100'}
        >
          <Div
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
            {canvasMode === 'iframe' ? (
              <iframe
                ref={iframeRef}
                src={initialIframeSrc}
                title="Book Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                }}
              />
            ) : ActiveStoryComponent ? (
              <BookDecorator theme={theme} layout="story">
                <ActiveStoryComponent />
              </BookDecorator>
            ) : (
              <Div p="6r" color="design.text.light" fontSize="3.5r" fontFamily="mono">
                No story available to render.
              </Div>
            )}
          </Div>
        </Main>
      </Div>
    </BookDecorator>
  )
}
