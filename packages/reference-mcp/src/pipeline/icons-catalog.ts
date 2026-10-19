// Stable facade over the icon search engine.
// It takes search options and emits ranked icon results, re-exporting the engine's document
// and result types plus the category list. Callers never touch MiniSearch directly.
import {
  searchEngine,
  type IconDocument,
  type IconReadout,
  type SearchIconsOptions,
  type SearchIconsResult,
  type DemandMatch,
} from './icons-search-index'

export type {
  IconDocument,
  IconReadout,
  SearchIconsOptions,
  SearchIconsResult,
  DemandMatch,
}

export const ICON_CATEGORIES: string[] = searchEngine.categories

export function searchIcons(options?: SearchIconsOptions): SearchIconsResult {
  return searchEngine.search(options)
}
