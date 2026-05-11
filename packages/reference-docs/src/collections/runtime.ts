/// <reference types="vite/client" />

import type { ComponentType } from 'react'
import { allDocs } from '../../.content-collections/generated'

const docModules = import.meta.glob<{
  default: ComponentType
}>('../content/docs/**/*.mdx', { eager: true })

type CollectionDoc = (typeof allDocs)[number]

export type DocMeta = CollectionDoc

export const docs: DocMeta[] = [...allDocs].sort(
  (a, b) => a.section.localeCompare(b.section) || a.order - b.order
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