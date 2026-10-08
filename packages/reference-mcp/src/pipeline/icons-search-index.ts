import MiniSearch, { type AsPlainObject } from 'minisearch'
import rawIndex from '../data/icons-index.json' with { type: 'json' }

export interface IconDocument {
  id?: number
  name: string
  slug?: string
  description: string
  categories: string[]
  tags?: string[]
}

export interface IconReadout {
  name: string
  description: string
  import?: string
  example?: string
  category?: string
  tags?: string[]
}

export interface DemandMatch {
  demand: string
  icons: IconReadout[]
}

export interface SearchIconsOptions {
  query?: string
  demands?: string[]
  category?: string
  limit?: number
  project?: string
  verbose?: boolean
}

export interface SearchIconsResult extends Record<string, unknown> {
  totalAvailable?: number
  message?: string
  categories?: string[]
  examples?: string[]
  total: number
  returned: number
  icons: IconReadout[]
  totalDemands?: number
  demands?: DemandMatch[]
}

export const MINI_SEARCH_CONFIG = {
  fields: ['canonical', 'name', 'slug', 'primarySynonyms', 'tags', 'description'],
  storeFields: ['name', 'description', 'categories'],
  searchOptions: {
    boost: {
      canonical: 30,
      primarySynonyms: 15,
      name: 8,
      slug: 6,
      tags: 3,
      description: 1,
    },
    fuzzy: (term: string) => (term.length > 3 ? 0.2 : false),
    prefix: true,
  },
}

function trimDescription(desc: string, maxLen = 220): string {
  if (!desc || desc.length <= maxLen) return desc
  const periodIdx = desc.indexOf('. ', 80)
  if (periodIdx !== -1 && periodIdx <= maxLen) {
    return desc.slice(0, periodIdx + 1)
  }
  const trimmed = desc.slice(0, maxLen)
  const lastSpace = trimmed.lastIndexOf(' ')
  return (lastSpace > 60 ? trimmed.slice(0, lastSpace) : trimmed) + '...'
}

interface StoredIconFields {
  name?: string
  description?: string
  categories?: string[]
}

export class IconsSearchEngine {
  readonly miniSearch: MiniSearch
  readonly categories: string[]
  readonly categoryPostings: Map<string, StoredIconFields[]>
  readonly allPostings: StoredIconFields[]

  constructor(serializedIndex: unknown) {
    const options = {
      fields: MINI_SEARCH_CONFIG.fields,
      storeFields: MINI_SEARCH_CONFIG.storeFields,
      searchOptions: MINI_SEARCH_CONFIG.searchOptions,
    }

    // The JSON import arrives already parsed: loadJS consumes the object
    // directly, killing a full stringify + reparse of the 5.27MB payload.
    this.miniSearch =
      typeof serializedIndex === 'string'
        ? MiniSearch.loadJSON(serializedIndex, options)
        : MiniSearch.loadJS(serializedIndex as AsPlainObject, options)

    // Extract categories across stored documents, plus prebuilt
    // category->entries postings (in index order) so category browse
    // skips MiniSearch entirely.
    const catSet = new Set<string>()
    const postings = new Map<string, StoredIconFields[]>()
    const all: StoredIconFields[] = []
    const docs = (this.miniSearch as unknown as { _storedFields: Map<number, StoredIconFields> })
      ._storedFields

    if (docs && docs instanceof Map) {
      for (const entry of docs.values()) {
        all.push(entry)
        if (Array.isArray(entry.categories)) {
          for (let i = 0; i < entry.categories.length; i++) {
            const c = entry.categories[i]
            if (!c) continue
            // Lower once at load: stored categories are then canonically
            // lowercase, so per-candidate filters use plain === (no alloc).
            const lower = c.toLowerCase()
            if (lower !== c) entry.categories[i] = lower
            catSet.add(lower)
            const list = postings.get(lower)
            if (list) list.push(entry)
            else postings.set(lower, [entry])
          }
        }
      }
    }

    this.categories = Array.from(catSet).sort()
    this.categoryPostings = postings
    this.allPostings = all
  }

  get documentCount(): number {
    return this.miniSearch.documentCount
  }

  extractDemands(input?: string | string[]): string[] {
    if (Array.isArray(input)) {
      return input.map(s => s.trim()).filter(Boolean)
    }
    let raw = (input || '').trim()
    if (!raw) return []

    // Split on sentence boundaries first
    const sentences = raw.split(/[.!?]+\s+/)
    const clauses: string[] = []

    for (const s of sentences) {
      const cleaned = s
        .replace(
          /^(can you (please )?(find|give me|show me)|i (need|want|am looking for|require))\s+(an?\s+)?(icons?\s+)?(for\s+)?/i,
          ''
        )
        .replace(/^(icons?\s+for\s+|icons?\s+)/i, '')
        .trim()

      // Skip introductory context sentences if other sentences exist
      if (/^(i am|we are|building|working on|creating)\b/i.test(cleaned) && sentences.length > 1) {
        continue
      }

      // Split on commas, semicolons, bullets, newlines, and ' and '
      const parts = cleaned
        .split(/[,;\n•]+|\s+and\s+/i)
        .map(p =>
          p
            .trim()
            .replace(/^[-*•\s]+/, '')
            .replace(/^(a|an|the|for|to|with|about)\s+/i, '')
            .replace(/\bicons?\b/gi, '')
            .trim()
        )
        .filter(p => p.length > 1)

      clauses.push(...parts)
    }

    return clauses.length > 0 ? clauses : [raw]
  }

  searchDemand(
    demand: string,
    limit = 5,
    category?: string,
    verbose = false
  ): { total: number; icons: IconReadout[] } {
    const dClean = demand.trim()
    if (!dClean) return { total: 0, icons: [] }

    const searchOptions: Parameters<MiniSearch['search']>[1] = {
      ...MINI_SEARCH_CONFIG.searchOptions,
    }

    if (category) {
      const catLower = category.toLowerCase()
      searchOptions.filter = result => {
        // Stored categories are lowered once at load: plain ===, no alloc.
        const cats = (result.categories as string[]) || []
        return cats.some(c => c === catLower)
      }
    }

    const results = this.miniSearch.search(dClean, searchOptions)

    const sliced = results.slice(0, limit).map(r => {
      const name = r.name as string
      const description = trimDescription((r.description as string) || '')
      const categories = (r.categories as string[]) || ['general']

      const readout: IconReadout = {
        name,
        description,
      }

      if (verbose) {
        readout.import = `import { ${name} } from '@reference-ui/icons'`
        readout.example = `<${name} size="md" color="text" />`
        readout.category = categories[0] || 'general'
      }

      return readout
    })

    return {
      total: results.length,
      icons: sliced,
    }
  }

  search(options?: SearchIconsOptions): SearchIconsResult {
    const rawQuery = options?.query?.trim()
    const demandsInput = options?.demands
    const category = options?.category?.trim().toLowerCase()
    const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : 25
    const verbose = Boolean(options?.verbose)

    // When no query, demands, or category is provided, return guidance instead of token dumps
    if (!rawQuery && (!demandsInput || demandsInput.length === 0) && !category) {
      return {
        totalAvailable: this.documentCount,
        message:
          "Reference UI provides 3,800+ Material Symbols React icons via @reference-ui/icons. Provide a search query, sentence, or list of demands (e.g. 'search', 'trash', 'user settings and cart') or filter by category.",
        categories: this.categories,
        examples: [
          "list_icons({ query: 'search' })",
          "list_icons({ query: 'trash' })",
          "list_icons({ query: 'I need an icon for user settings, shopping cart, and trash' })",
          "list_icons({ demands: ['shopping cart', 'logout', 'settings'] })",
          "list_icons({ category: 'navigation' })",
        ],
        total: 0,
        returned: 0,
        icons: [],
      }
    }

    // Determine demands
    const extractedDemands =
      demandsInput && demandsInput.length > 0
        ? demandsInput.map(d => d.trim()).filter(Boolean)
        : rawQuery
          ? this.extractDemands(rawQuery)
          : []

    // If multiple demands were provided or detected
    if (extractedDemands.length > 1) {
      const demandMatches: DemandMatch[] = []
      const seenNames = new Set<string>()
      const flatIcons: IconReadout[] = []

      // Allocate per-demand limit (defaults to 2 top icons per demand, or distributed if explicit limit)
      const perDemandLimit = options?.limit
        ? Math.max(1, Math.min(5, Math.floor(limit / extractedDemands.length)))
        : 2

      for (const demand of extractedDemands) {
        const { icons: matches } = this.searchDemand(demand, perDemandLimit, category, verbose)
        demandMatches.push({ demand, icons: matches })
        for (const icon of matches) {
          if (!seenNames.has(icon.name)) {
            seenNames.add(icon.name)
            flatIcons.push(icon)
          }
        }
      }

      return {
        totalDemands: extractedDemands.length,
        demands: demandMatches,
        total: flatIcons.length,
        returned: flatIcons.length,
        icons: flatIcons,
      }
    }

    // Single demand or category browse
    const singleQuery = extractedDemands[0] || rawQuery || ''
    if (singleQuery) {
      const { total, icons } = this.searchDemand(singleQuery, limit, category, verbose)
      return {
        total,
        returned: icons.length,
        icons,
      }
    }

    // Category-only browse via prebuilt postings (skips MiniSearch entirely;
    // postings preserve index order, matching wildcard order exactly).
    const matches = category ? (this.categoryPostings.get(category) ?? []) : this.allPostings

    const sliced = matches.slice(0, limit).map(e => {
      const name = e.name as string
      const description = (e.description as string) || ''
      const categories = (e.categories as string[]) || ['general']

      const readout: IconReadout = {
        name,
        description,
      }

      if (verbose) {
        readout.import = `import { ${name} } from '@reference-ui/icons'`
        readout.example = `<${name} size="md" color="text" />`
        readout.category = categories[0] || 'general'
      }

      return readout
    })

    return {
      total: matches.length,
      returned: sliced.length,
      icons: sliced,
    }
  }
}

// Singleton search engine instance powered by battle-tested MiniSearch
export const searchEngine = new IconsSearchEngine(rawIndex)
