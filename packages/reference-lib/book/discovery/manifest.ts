import { storyLoaders } from './glob'
import type { BookManifestEntry, BookCategory } from './types'

export function createManifestEntry(filePath: string): BookManifestEntry {
  const cleanPath = filePath.replace(/^\.\.\/\.\.\/src\//, 'src/')
  const fileName = filePath.split('/').pop() || ''
  const rawName = fileName.replace(/\.book\.[^.]+$/, '')

  let category = 'Components'
  if (filePath.includes('/Reference/') || filePath.includes('components/Reference/')) {
    category = 'Reference'
  } else if (filePath.includes('/core/')) {
    category = 'Core'
  }

  let id = rawName
  let title = rawName

  if (category === 'Reference' && rawName !== 'Reference') {
    id = `Reference/${rawName}`
    title = rawName
  }

  return {
    id,
    name: rawName,
    title,
    category,
    filePath,
  }
}

export function getManifestEntries(): BookManifestEntry[] {
  const entries: BookManifestEntry[] = []

  for (const path of Object.keys(storyLoaders)) {
    entries.push(createManifestEntry(path))
  }

  return entries.sort((a, b) => {
    if (a.category !== b.category) {
      if (a.category === 'Components') return -1
      if (b.category === 'Components') return 1
      return a.category.localeCompare(b.category)
    }
    return a.title.localeCompare(b.title)
  })
}

export function getManifestEntry(idOrName: string): BookManifestEntry | undefined {
  if (!idOrName) return undefined
  const entriesList = getManifestEntries()
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

export function groupManifestByCategory(entries: BookManifestEntry[]): BookCategory[] {
  const groups = new Map<string, BookManifestEntry[]>()
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
