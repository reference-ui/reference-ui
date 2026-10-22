// Collection check of the docs gate. It takes the docs package directory and emits one finding for
// each .mdx page under src/content that the built docs collection does not list, or one finding when
// that collection has not been built. content-collections drops a page whose frontmatter does not
// parse and says nothing about it, so the generated output is the only place such a page shows up.
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { walk } from './walk.mjs'

const MDX_EXTS = new Set(['.mdx'])
const GENERATED_INDEX = path.join('src', 'collections', '.content-collections', 'generated', 'index.js')
const SYNC = 'run pnpm --filter @reference-ui/reference-docs run sync'

/** Findings for the pages the built docs collection leaves out, or for a collection not yet built. */
export async function collectionFindings({ docsDir }) {
  const indexFile = path.join(docsDir, GENERATED_INDEX)
  const built = await builtPaths(docsDir, indexFile)
  if (!built) {
    return [
      {
        file: indexFile,
        line: 1,
        ruleId: 'docs/collection',
        severity: 2,
        message: `the built docs collection is missing or unreadable; ${SYNC}`,
      },
    ]
  }
  const pages = new Set()
  await walk(path.join(docsDir, 'src/content'), MDX_EXTS, pages)
  return [...pages]
    .sort()
    .filter(file => !built.has(file))
    .map(file => ({
      file,
      line: 1,
      ruleId: 'docs/collection',
      severity: 2,
      message: `not in the built docs collection, so its route shows Not found; ${SYNC}, then fix any frontmatter it reports`,
    }))
}

/** Absolute page paths the built collection lists, or `null` when the generated index cannot be loaded. */
async function builtPaths(docsDir, indexFile) {
  let generated
  try {
    generated = await import(pathToFileURL(indexFile).href)
  } catch {
    return null
  }
  if (!Array.isArray(generated.allDocs)) return null
  // The transform writes each page's path relative to src/collections, where the config lives.
  const collectionsDir = path.join(docsDir, 'src/collections')
  return new Set(
    generated.allDocs
      .filter(doc => typeof doc?.path === 'string')
      .map(doc => path.resolve(collectionsDir, doc.path))
  )
}
