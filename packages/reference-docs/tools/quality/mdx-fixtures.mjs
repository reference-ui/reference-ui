// Shared fixtures for the MDX gate's unit tests: page templates and helpers that write a temporary docs
// tree, an earlier collection build, and a collection config in the app's shape. Each test file calls
// `after(removeFixtures)` so the trees it made are deleted. It holds no tests itself.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const DASH = '—'
export const PAGE = (fields, body = '# Title\n') => `---\n${fields}\n---\n\n${body}`
export const VALID = 'title: Title\nsection: Guides\norder: 1\nslug: page\ndescription: A page.'
export const withSlug = slug => VALID.replace('slug: page', `slug: ${slug}`)
const scratch = []

/** Removes every temporary docs tree `fixtureSite` made; register it with `after`. */
export async function removeFixtures() {
  for (const dir of scratch) await rm(dir, { recursive: true, force: true })
}

/** Writes `files` into a temporary docs tree under src/content/docs. */
export async function fixtureSite(files) {
  const docsDir = await mkdtemp(path.join(tmpdir(), 'mdx-gate-'))
  scratch.push(docsDir)
  const dir = path.join(docsDir, 'src/content/docs')
  await mkdir(dir, { recursive: true })
  for (const [name, text] of Object.entries(files)) await writeFile(path.join(dir, name), text)
  return { docsDir, dir }
}

/** Writes an earlier build's output into the app's output directory, listing `paths` in the shape content-collections emits. */
export async function builtCollection(docsDir, paths) {
  const dir = path.join(docsDir, 'src/collections/.content-collections/generated')
  await mkdir(dir, { recursive: true })
  const docs = paths.map(p => ({ title: 'T', section: 'G', order: 1, slug: 's', description: 'd', path: p }))
  await writeFile(path.join(dir, 'allDocs.js'), `export default ${JSON.stringify(docs)}\n`)
  await writeFile(path.join(dir, 'index.js'), 'import allDocs from "./allDocs.js";\nexport { allDocs };\n')
}

/**
 * Writes the docs collection config in the app's shape: its paths, parser and schema. `guard` adds a
 * drop guard that throws after the build has written its output, as docs.ts does. `broken` makes the
 * config import a file that is not there.
 */
export async function fixtureConfig(docsDir, { guard = false, broken = false } = {}) {
  const dir = path.join(docsDir, 'src/collections')
  await mkdir(dir, { recursive: true })
  const lines = [
    broken ? "import './not-there.ts'" : null,
    "import { defineCollection, defineConfig } from '@content-collections/core'",
    "import { z } from 'zod'",
    'const docs = defineCollection({',
    "  name: 'docs',",
    "  directory: '../content/docs',",
    "  include: '**/*.mdx',",
    "  parser: 'frontmatter-only',",
    '  schema: z.object({',
    '    title: z.string(),',
    '    section: z.string(),',
    '    order: z.number(),',
    '    slug: z.string(),',
    '    description: z.string(),',
    '  }),',
    `  transform: ({ _meta, ...doc }) => ({ ...doc, path: \`../content/docs/\${_meta.filePath}\` }),`,
    guard ? "  onSuccess: () => { throw new Error('a page was dropped') }," : null,
    '})',
    'export default defineConfig({ content: [docs] })',
  ]
  await writeFile(path.join(dir, 'content-collections.ts'), `${lines.filter(Boolean).join('\n')}\n`)
}
