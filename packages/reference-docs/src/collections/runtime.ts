// Runtime slug lookup for the Vite MDX pipeline.
// It takes the generated collection metadata plus an eager glob of MDX modules and emits
// the sidebar tree (section, then optional group, then pages), the flat docs list in that
// same order for the pager, and the slug-to-module map DocPage renders from.
/// <reference types="vite/client" />

import type { ComponentType } from 'react'
import { allDocs } from './.content-collections/generated'

const docModules = import.meta.glob<{
  default: ComponentType
}>('../content/docs/**/*.mdx', { eager: true })

type CollectionDoc = (typeof allDocs)[number]

export type DocMeta = CollectionDoc

/** A sub-section heading and its pages, sorted by `order`. */
export interface NavGroup {
  name: string
  items: DocMeta[]
}

/** One sidebar section: ungrouped pages first, then groups. */
export interface NavSection {
  name: string
  items: DocMeta[]
  groups: NavGroup[]
}

/** Sidebar section order; unknown sections sort last, then alphabetically. */
const SECTION_ORDER = ['Get started', 'Guides', 'MCP', 'System', 'Foundations', 'Components']

function sectionRank(section: string): number {
  const rank = SECTION_ORDER.indexOf(section)
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

const byOrder = (a: DocMeta, b: DocMeta) => a.order - b.order

function buildSection(name: string, pages: DocMeta[]): NavSection {
  const sorted = [...pages].sort(byOrder)
  const groups = new Map<string, DocMeta[]>()
  for (const doc of sorted) {
    if (doc.group) groups.set(doc.group, [...(groups.get(doc.group) ?? []), doc])
  }
  // Pages arrive sorted, so each group's first page holds its lowest order: Map keeps that.
  return {
    name,
    items: sorted.filter(doc => !doc.group),
    groups: [...groups].map(([group, items]) => ({ name: group, items })),
  }
}

const sectionNames = [...new Set(allDocs.map(doc => doc.section))].sort(
  (a, b) => sectionRank(a) - sectionRank(b) || a.localeCompare(b)
)

export const navSections: NavSection[] = sectionNames.map(name =>
  buildSection(
    name,
    allDocs.filter(doc => doc.section === name)
  )
)

/** Every page in sidebar order, so the pager walks the rail top to bottom. */
export const docs: DocMeta[] = navSections.flatMap(section => [
  ...section.items,
  ...section.groups.flatMap(group => group.items),
])

export const slugToModule = Object.fromEntries(
  docs.map(doc => [doc.slug, docModules[doc.path]?.default])
)
