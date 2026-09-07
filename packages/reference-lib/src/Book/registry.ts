import * as React from 'react'
import type { BookEntry, BookCategory, BookModule, BookStory } from './types'

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

// Discover all book and fixture files across the source tree eagerly at compile/bundle time
const rawModules = import.meta.glob<BookModule>([
  '../components/**/*.{book,fixture}.{ts,tsx,js,jsx}',
  '../*.{book,fixture}.{ts,tsx,js,jsx}',
  '../**/*.book.{ts,tsx,js,jsx}',
], { eager: true })

export function createBookEntry(filePath: string, mod: BookModule): { entry: BookEntry; priority: number } {
  const cleanPath = filePath.replace(/^\.\.\//, '')
  const fileName = cleanPath.split('/').pop() || ''
  const isBook = fileName.includes('.book.')
  const priority = isBook ? 2 : 1

  const rawName = fileName.replace(/\.(book|fixture)\.[^.]+$/, '')

  let category = 'Components'
  if (cleanPath.includes('/Reference/') || cleanPath.startsWith('components/Reference/')) {
    category = 'Reference'
  } else if (cleanPath.startsWith('core/')) {
    category = 'Core'
  }

  let id = rawName
  let title = rawName

  if (category === 'Reference' && rawName !== 'Reference') {
    id = `Reference/${rawName}`
    title = rawName
  }

  return {
    entry: {
      id,
      name: rawName,
      get title() {
        return mod.meta?.title || title
      },
      get category() {
        return mod.meta?.category || category
      },
      filePath: cleanPath,
      module: mod,
      get stories() {
        return normalizeStories(mod)
      },
    },
    priority,
  }
}

export function getBookEntries(): BookEntry[] {
  const entryMap = new Map<string, { entry: BookEntry; priority: number }>()

  for (const [path, mod] of Object.entries(rawModules as Record<string, BookModule>)) {
    const { entry, priority } = createBookEntry(path, mod)
    const existing = entryMap.get(entry.id.toLowerCase())
    if (!existing || priority > existing.priority) {
      entryMap.set(entry.id.toLowerCase(), { entry, priority })
    }
  }

  return Array.from(entryMap.values())
    .map(item => item.entry)
    .sort((a, b) => {
      if (a.category !== b.category) {
        if (a.category === 'Components') return -1
        if (b.category === 'Components') return 1
        return a.category.localeCompare(b.category)
      }
      return a.title.localeCompare(b.title)
    })
}

export function getBookEntry(idOrName: string): BookEntry | undefined {
  if (!idOrName) return undefined
  const entriesList = getBookEntries()
  const query = idOrName.toLowerCase().trim()

  const direct = entriesList.find(e => e.id.toLowerCase() === query)
  if (direct) return direct

  const byName = entriesList.find(e => e.name.toLowerCase() === query)
  if (byName) return byName

  return entriesList.find(e =>
    e.filePath.toLowerCase().includes(query) ||
    e.id.toLowerCase().endsWith(query)
  )
}

export function groupEntriesByCategory(entries: BookEntry[]): BookCategory[] {
  const groups = new Map<string, BookEntry[]>()
  for (const entry of entries) {
    const list = groups.get(entry.category) || []
    list.push(entry)
    groups.set(entry.category, list)
  }

  const result: BookCategory[] = []
  for (const [name, list] of groups.entries()) {
    result.push({ name, entries: list })
  }
  return result
}
