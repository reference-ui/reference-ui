/// <reference types="vite/client" />

import type { ComponentType } from 'react'
import { allDocs } from './.content-collections/generated'

const docModules = import.meta.glob<{
  default: ComponentType
}>('../content/docs/**/*.mdx', { eager: true })

type CollectionDoc = (typeof allDocs)[number]

export type DocMeta = CollectionDoc

/** Sidebar section order; unknown sections sort last, then alphabetically. */
const SECTION_ORDER = ['Getting Started', 'Foundations', 'Components', 'Reference']

function sectionRank(section: string): number {
  const rank = SECTION_ORDER.indexOf(section)
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

export const docs: DocMeta[] = [...allDocs].sort(
  (a, b) => sectionRank(a.section) - sectionRank(b.section) || a.order - b.order
)

export const docsBySection = docs.reduce(
  (acc, doc) => {
    if (!acc[doc.section]) acc[doc.section] = []
    acc[doc.section].push(doc)
    return acc
  },
  {} as Record<string, DocMeta[]>
)

export const slugToModule = Object.fromEntries(
  docs.map(doc => [doc.slug, docModules[doc.path]?.default])
)