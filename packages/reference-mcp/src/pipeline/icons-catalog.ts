import rawMetadata from '../data/icons-metadata.json' with { type: 'json' }

export interface IconMetadataEntry {
  name: string
  slug: string
  categories: string[]
  tags: string[]
  description: string
}

export interface IconReadout {
  name: string
  import: string
  description: string
  tags: string[]
  category: string
  example: string
}

export interface SearchIconsOptions {
  query?: string
  category?: string
  limit?: number
  project?: string
}

const ICONS_MAP: Record<string, IconMetadataEntry> = rawMetadata as Record<string, IconMetadataEntry>
const ALL_ENTRIES = Object.values(ICONS_MAP)

export const ICON_CATEGORIES: string[] = Array.from(
  new Set(ALL_ENTRIES.flatMap(entry => entry.categories))
).filter(Boolean).sort()

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function searchIcons(options?: SearchIconsOptions) {
  const query = options?.query?.trim().toLowerCase()
  const category = options?.category?.trim().toLowerCase()
  const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : 25

  // When no query and no category are provided, return guidance instead of token-bloating dumps
  if (!query && !category) {
    return {
      totalAvailable: ALL_ENTRIES.length,
      message:
        "Reference UI provides 3,800+ Material Symbols React icons via @reference-ui/icons. Provide a search query (name, tag, or semantic keyword like 'search', 'trash', 'gear', 'pencil', 'arrow') or filter by category.",
      categories: ICON_CATEGORIES,
      examples: [
        "list_icons({ query: 'search' })",
        "list_icons({ query: 'trash' })",
        "list_icons({ query: 'settings' })",
        "list_icons({ category: 'navigation' })",
      ],
      total: 0,
      returned: 0,
      icons: [],
    }
  }

  const queryWordRegex = query
    ? new RegExp('(?:^|\\s|_|-)' + escapeRegex(query) + '(?:$|\\s|_|-)', 'i')
    : null

  const scored: Array<{ item: IconMetadataEntry; score: number }> = []

  for (const item of ALL_ENTRIES) {
    if (category && !item.categories.some(c => c.toLowerCase() === category)) {
      continue
    }

    if (!query) {
      scored.push({ item, score: 10 })
      continue
    }

    const nameLower = item.name.toLowerCase()
    const rawLower = item.name.replace(/Icon$/, '').toLowerCase()
    const slugLower = item.slug.toLowerCase()

    // Words from PascalCase name and snake_case slug
    const nameWords = item.name
      .replace(/Icon$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/\s+/)
    const slugWords = item.slug.toLowerCase().split(/[_-]/)
    const isWordMatch = nameWords.includes(query) || slugWords.includes(query)

    let score = 0
    const tagIndex = item.tags.findIndex(t => t.toLowerCase() === query)

    if (nameLower === query || rawLower === query || slugLower === query) {
      score = 100
    } else if (tagIndex !== -1) {
      // Early tags are primary synonyms and rank higher than distant related terms
      score = 95 - Math.min(tagIndex, 20) * 0.5
    } else if (isWordMatch) {
      score = 85
    } else if (rawLower.startsWith(query) || slugLower.startsWith(query)) {
      score = 80
    } else if (queryWordRegex && item.tags.some(t => queryWordRegex.test(t))) {
      score = 70
    } else if (nameLower.includes(query) && query.length >= 4) {
      score = 60
    } else if (item.tags.some(t => t.toLowerCase().includes(query)) && query.length >= 4) {
      score = 40
    } else if (item.description.toLowerCase().includes(query)) {
      score = 30
    }

    if (score > 0) {
      scored.push({ item, score })
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.item.name.length !== b.item.name.length) return a.item.name.length - b.item.name.length
    return a.item.name.localeCompare(b.item.name)
  })

  const sliced = scored.slice(0, limit).map(({ item }): IconReadout => {
    const matchingTags = query ? item.tags.filter(t => t.toLowerCase().includes(query)) : []
    const otherTags = item.tags.filter(t => !matchingTags.includes(t))
    const tags = [...matchingTags, ...otherTags].slice(0, 8)
    const matchedCategory = category
      ? item.categories.find(c => c.toLowerCase() === category) ?? item.categories[0] ?? 'general'
      : item.categories[0] ?? 'general'

    return {
      name: item.name,
      import: `import { ${item.name} } from '@reference-ui/icons'`,
      description: item.description,
      tags,
      category: matchedCategory,
      example: `<${item.name} size="md" color="text" />`,
    }
  })

  return {
    total: scored.length,
    returned: sliced.length,
    icons: sliced,
  }
}
