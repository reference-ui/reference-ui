import * as React from 'react'
import { storyLoaders } from './glob'
import type { BookManifestEntry, BookLoadedEntry, BookModule, BookStory } from './types'

export function normalizeStories(mod: BookModule): BookStory[] {
  const stories: BookStory[] = []
  const seenNames = new Set<string>()

  function addStory(name: string, component: any) {
    if (!component || seenNames.has(name.toLowerCase())) return
    if (
      typeof component === 'function' ||
      (typeof component === 'object' && component !== null && (component.$$typeof || React.isValidElement(component)))
    ) {
      const Comp = React.isValidElement(component) ? () => component : component
      stories.push({ name, component: Comp })
      seenNames.add(name.toLowerCase())
    }
  }

  if (mod.default) {
    if (
      typeof mod.default === 'function' ||
      React.isValidElement(mod.default) ||
      (typeof mod.default === 'object' && mod.default.$$typeof)
    ) {
      addStory('Default', mod.default)
    } else if (typeof mod.default === 'object') {
      for (const [key, comp] of Object.entries(mod.default)) {
        addStory(key, comp)
      }
    }
  }

  // Scan named exports
  for (const [key, comp] of Object.entries(mod)) {
    if (key !== 'default' && key !== 'meta') {
      addStory(key, comp)
    }
  }

  if (stories.length === 0) {
    stories.push({
      name: 'Default',
      component: () =>
        React.createElement(
          'div',
          { style: { padding: '2rem', color: '#888', fontFamily: 'sans-serif' } },
          'No story exports found in this book file.'
        ),
    })
  }

  return stories
}

const moduleCache = new Map<string, BookLoadedEntry>()

export async function loadStory(entry: BookManifestEntry): Promise<BookLoadedEntry> {
  const loader = storyLoaders[entry.filePath]
  if (!loader) {
    throw new Error(`No loader found for story file: ${entry.filePath}`)
  }

  const startMark = `book:story-import-start:${entry.id}`
  const endMark = `book:story-import-end:${entry.id}`
  const measureName = `book:story-import:${entry.id}`

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(startMark)
  }
  const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()

  let mod: BookModule
  try {
    mod = await loader()
  } finally {
    const t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
    const importDurationMs = Math.round(t1 - t0)

    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      try {
        performance.mark(endMark)
        performance.measure(measureName, startMark, endMark)
      } catch {
        // ignore mark collision
      }
    }

    // Record timing on window for client perf tracking
    if (typeof window !== 'undefined') {
      ;(window as any).__BOOK_LAST_STORY_IMPORT_MS__ = importDurationMs
    }
  }

  const stories = normalizeStories(mod)
  const meta = mod.meta
  const title = meta?.title || entry.title
  const category = meta?.category || entry.category

  const loaded: BookLoadedEntry = {
    ...entry,
    title,
    category,
    module: mod,
    stories,
    meta,
    loadTimeMs: (typeof window !== 'undefined' && (window as any).__BOOK_LAST_STORY_IMPORT_MS__) || 0,
  }

  moduleCache.set(entry.id, loaded)
  return loaded
}

export function getCachedLoadedEntry(id: string): BookLoadedEntry | undefined {
  return moduleCache.get(id)
}
