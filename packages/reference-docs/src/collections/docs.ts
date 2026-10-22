// Docs collection schema, transform and drop guard.
// It takes raw MDX frontmatter and emits validated doc metadata: title, section, order,
// slug, the description lead, the optional group (a sub-section heading in the sidebar) and
// the page path. content-collections drops a page whose frontmatter does not parse and
// reports nothing for it, so onSuccess fails the build when an .mdx page under src/content
// is missing from the built documents.
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { defineCollection } from '@content-collections/core'
import { z } from 'zod'

// The build runs from the package root, where the --config and Vite configPath paths resolve.
const COLLECTIONS_DIR = path.resolve('src/collections')
const CONTENT_DIR = path.resolve('src/content')

/** Throws, naming each page, when an .mdx under src/content has no built document. */
async function failOnDroppedPages(documentPaths: string[]): Promise<void> {
  // The transform writes each path relative to the config's directory, src/collections.
  const built = new Set(documentPaths.map(p => path.resolve(COLLECTIONS_DIR, p)))
  const pages = (await readdir(CONTENT_DIR, { recursive: true }))
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.join(CONTENT_DIR, file))
  const dropped = pages
    .filter(page => !built.has(page))
    .map(page => path.relative(process.cwd(), page))
  if (dropped.length === 0) return
  throw new Error(
    `${dropped.join(', ')} did not reach the docs collection, so its route would show Not found. ` +
      'Its frontmatter does not parse or a field is invalid; run `pnpm agentdocs q` for the line.'
  )
}

export const docsCollection = defineCollection({
  name: 'docs',
  directory: '../content/docs',
  include: '**/*.mdx',
  parser: 'frontmatter-only',
  schema: z.object({
    title: z.string(),
    section: z.string(),
    group: z.string().optional(),
    order: z.number(),
    slug: z.string(),
    description: z.string(),
  }),
  transform: ({ _meta, ...doc }) => ({
    ...doc,
    path: `../content/docs/${_meta.filePath}`,
  }),
  onSuccess: documents => failOnDroppedPages(documents.map(doc => doc.path)),
})
