// Docs collection schema and transform.
// It takes raw MDX frontmatter and emits validated doc metadata: title, section, order,
// slug, and the optional description lead.
import { defineCollection } from '@content-collections/core'
import { z } from 'zod'

export const docsCollection = defineCollection({
  name: 'docs',
  directory: '../content/docs',
  include: '**/*.mdx',
  parser: 'frontmatter-only',
  schema: z.object({
    title: z.string(),
    section: z.string(),
    order: z.number(),
    slug: z.string(),
    description: z.string().optional(),
  }),
  transform: ({ _meta, ...doc }) => ({
    ...doc,
    path: `../content/docs/${_meta.filePath}`,
  }),
})