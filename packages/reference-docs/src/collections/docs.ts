import { defineCollection } from '@content-collections/core'
import { z } from 'zod'

export const docsCollection = defineCollection({
  name: 'docs',
  directory: 'src/content/docs',
  include: '**/*.mdx',
  parser: 'frontmatter-only',
  schema: z.object({
    title: z.string(),
    section: z.string(),
    order: z.number(),
    slug: z.string(),
  }),
  transform: ({ _meta, ...doc }) => ({
    ...doc,
    path: `../content/docs/${_meta.filePath}`,
  }),
})