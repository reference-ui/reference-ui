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
import {
  LightModeIcon,
  DarkModeIcon,
} from '@reference-ui/icons'
import { getManifestEntries, getManifestEntry, groupManifestByCategory } from '../discovery/manifest'
import { BookDecorator } from '../decorator/BookDecorator'
import { BookCanvas, VIEWPORT_CONFIGS } from './BookCanvas'
import type { ViewportPreset } from '../discovery/types'

export function BookShell() {
  const allEntries = React.useMemo(() => getManifestEntries(), [])

  // Parse initial query params
  const initialParams = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      book: params.get('book') || allEntries[0]?.id || '',
      story: params.get('story') || '',
      theme: (params.get('theme') === 'light' ? 'light' : 'dark') as 'dark' | 'light',
      viewport: (params.get('viewport') || 'full') as ViewportPreset,
      chrome: params.get('chrome') !== '0',
    }
  }, [allEntries])

  const [selectedBookId, setSelectedBookId] = React.useState<string>(initialParams.book)
  const [selectedStoryName, setSelectedStoryName] = React.useState<string>(initialParams.story)
  const [theme, setTheme] = React.useState<'dark' | 'light'>(initialParams.theme)
  const [viewport, setViewport] = React.useState<ViewportPreset>(initialParams.viewport)
  const [search, setSearch] = React.useState('')
  const [availableStories, setAvailableStories] = React.useState<{ name: string }[]>([])

  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const isDark = theme === 'dark'
  const subtleBorder = isDark ? 'gray.800' : 'gray.200'
  const hasChrome = initialParams.chrome

  // Current active entry
  const currentEntry = React.useMemo(() => {
    return getManifestEntry(selectedBookId) || allEntries[0]
  }, [selectedBookId, allEntries])

  // Sync browser URL cleanly
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
    if (viewport !== 'full') {
      url.searchParams.set('viewport', viewport)
    } else {
      url.searchParams.delete('viewport')
    }
    if (!hasChrome) {
      url.searchParams.set('chrome', '0')
    }
    window.history.replaceState({}, '', url.toString())
  }, [currentEntry, selectedStoryName, theme, viewport, hasChrome])

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
    if (!q) return groupManifestByCategory(allEntries)

    const matching = allEntries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
    return groupManifestByCategory(matching)
  }, [allEntries, search])

  // Headless mode for capture (?chrome=0)
  if (!hasChrome) {
    return (
      <BookCanvas
        entry={currentEntry}
        storyName={selectedStoryName}
        theme={theme}
        viewport={viewport}
      />
    )
  }

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

          {/* Theme Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            p="1.5r"
            borderRadius="sm"
            border="none"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            color="design.text.base"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            _hover={{ bg: isDark ? 'gray.800' : 'gray.200' }}
          >
            {isDark ? <LightModeIcon size="md" /> : <DarkModeIcon size="md" />}
          </Button>
        </Header>

        {/* Search Bar */}
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
                    const hasMultipleStories = isSelected && availableStories.length > 1

                    return (
                      <Div key={entry.id} display="flex" flexDirection="column">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBookId(entry.id)
                            setSelectedStoryName('')
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
                          <Span fontSize="2.8r" textAlign="left">{entry.title}</Span>
                          {hasMultipleStories && (
                            <Span
                              fontSize="2.2r"
                              px="1.5r"
                              py="0.2r"
                              borderRadius="sm"
                              bg={isDark ? 'gray.800' : 'gray.300'}
                              color="design.text.light"
                              fontWeight="600"
                            >
                              {availableStories.length}
                            </Span>
                          )}
                        </Button>

                        {/* Indented Sub-stories for multi-story components */}
                        {isSelected && hasMultipleStories && (
                          <Div
                            pl="3r"
                            ml="2.5r"
                            my="1r"
                            display="flex"
                            flexDirection="column"
                            gap="0.5r"
                            borderLeft="2px solid"
                            borderLeftColor={isDark ? 'gray.800' : 'gray.200'}
                          >
                            {availableStories.map(story => {
                              const isStoryActive = (selectedStoryName || availableStories[0]?.name).toLowerCase() === story.name.toLowerCase()
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
        {/* Top Control Bar */}
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
            {availableStories.length > 1 && (
              <>
                <Span fontSize="3.2r" color="design.text.lighter">
                  /
                </Span>
                <Span fontSize="3.2r" color="design.text.base" fontWeight="500">
                  {selectedStoryName || availableStories[0]?.name}
                </Span>
              </>
            )}
          </Div>

          {/* Controls: Presets Pill */}
          <Div display="flex" alignItems="center" gap="2.5r">
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
          </Div>
        </Header>

        {/* Canvas Host */}
        <Main
          flex="1"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="auto"
          p={viewport === 'full' ? '0' : '4r'}
          bg={isDark ? 'gray.950' : 'gray.100'}
        >
          <BookCanvas
            entry={currentEntry}
            storyName={selectedStoryName}
            theme={theme}
            viewport={viewport}
            onAvailableStories={setAvailableStories}
          />
        </Main>
      </Div>
    </BookDecorator>
  )
}
