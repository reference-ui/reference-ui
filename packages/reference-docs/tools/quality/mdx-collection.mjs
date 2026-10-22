// Collection tier of the docs gate. It takes the docs package directory and builds the docs collection
// in-process from the app's own config, into a scratch directory, so it never reads an earlier sync's
// output. It returns `{ errors, missing }`: one error for each .mdx page under src/content that the build
// leaves out, or one error when the build fails and no page explains it, and `missing` names
// content-collections when it is not installed. content-collections drops a page whose frontmatter does
// not parse and reports nothing for it, so the built documents are the only place that drop shows.
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { walk } from './walk.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MDX_EXTS = new Set(['.mdx'])
const CONFIG = path.join('src', 'collections', 'content-collections.ts')
// Scratch builds live in the package's own node_modules. The bundled config imports
// @content-collections/core and zod by bare name, and Node resolves those from where the bundle is written.
const SCRATCH_ROOT = path.join(HERE, '..', '..', 'node_modules', '.cache', 'docs-gate')
const NOT_LISTED =
  'not in the docs collection, so its route shows Not found; its frontmatter does not parse or a field is invalid'

/** Errors for the .mdx pages the docs collection leaves out, or for a build that fails and names no page. */
export async function collectionTier({ docsDir }) {
  let createBuilder
  try {
    ({ createBuilder } = await import('@content-collections/core'))
  } catch {
    return { errors: [], missing: 'content-collections' }
  }
  const configFile = path.join(docsDir, CONFIG)
  await mkdir(SCRATCH_ROOT, { recursive: true })
  // Its type makes the generated index load as ESM, since Node's package lookup stops at node_modules.
  await writeFile(path.join(SCRATCH_ROOT, 'package.json'), '{ "type": "module" }\n')
  const scratch = await mkdtemp(path.join(SCRATCH_ROOT, 'run-'))
  try {
    const outputDir = path.join(scratch, 'generated')
    const build = await buildCollection(createBuilder, configFile, scratch, outputDir)
    const built = await builtPaths(docsDir, outputDir)
    if (built) {
      const missing = await unlistedPages(docsDir, built)
      // A build that fails after writing its output, with pages missing, failed on those pages: the
      // page errors say which, so the build's own error would only repeat them.
      if (missing.length || !build.failed) return { errors: missing, missing: null }
    }
    return { errors: [buildFinding(configFile, build)], missing: null }
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}

/** Runs the collection build into `outputDir`. `failed` says whether it threw, and `error` is what it threw. */
async function buildCollection(createBuilder, configFile, scratch, outputDir) {
  try {
    const builder = await createBuilder(configFile, {
      configName: 'collection-config.mjs',
      cacheDir: path.join(scratch, 'cache'),
      outputDir,
    })
    await builder.build()
    return { failed: false }
  } catch (error) {
    return { failed: true, error }
  }
}

/** One error for the build as a whole, named by its first error line. */
function buildFinding(file, build) {
  const detail = build.failed
    ? String(build.error?.message ?? build.error).split('\n')[0]
    : 'its output could not be read'
  return {
    file,
    line: 1,
    ruleId: 'docs/collection',
    severity: 2,
    message: `the docs collection did not build: ${detail}`,
  }
}

/** Absolute page paths the build lists, or `null` when its generated index cannot be loaded. */
async function builtPaths(docsDir, outputDir) {
  let generated
  try {
    generated = await import(pathToFileURL(path.join(outputDir, 'index.js')).href)
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

/** One error for each .mdx page under src/content whose path is not in `built`. */
async function unlistedPages(docsDir, built) {
  const pages = new Set()
  await walk(path.join(docsDir, 'src/content'), MDX_EXTS, pages)
  return [...pages]
    .sort()
    .filter(file => !built.has(file))
    .map(file => ({ file, line: 1, ruleId: 'docs/collection', severity: 2, message: NOT_LISTED }))
}
