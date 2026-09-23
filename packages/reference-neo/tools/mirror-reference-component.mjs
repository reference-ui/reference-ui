// Mirrors the living Reference presentation set from reference-lib source into the
// gitignored Neo browser-component mirror. It descends only into the living roots
// (components and document), prepends @ts-nocheck plus a provenance header to each
// file, and rewrites @reference-ui/types imports to the neighboring browser
// adapter. It reads lib source from disk at mirror time, and that read is the
// explicit seam.

import { mkdir, open, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const { setTimeout: delayTimeout } = globalThis

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const NEO_DIR = join(SCRIPT_DIR, '..')
const REPO_DIR = join(NEO_DIR, '..', '..')
const SOURCE_DIR = join(
  REPO_DIR,
  'packages',
  'reference-lib',
  'src',
  'components',
  'Reference'
)
const TARGET_DIR = join(NEO_DIR, 'src', 'reference', 'browser-component')
const TYPES_ADAPTER_FILE = join(
  NEO_DIR,
  'src',
  'reference',
  'browser',
  'component-api.ts'
)
const LOCK_FILE = join(NEO_DIR, '.mirror-reference-component.lock')

// Living roots from the port map: everything else under the lib source tree
// (shell, fixtures, theme) stays in lib and is never mirrored into Neo.
const MIRROR_ROOTS = ['components', 'document']

const GENERATED_README = `# Browser Component Mirror

This directory is a mirrored component tree (partial: living set only).

Source of truth:

- packages/reference-lib/src/components/Reference/components
- packages/reference-lib/src/components/Reference/document

These files are copied by:

- packages/reference-neo/tools/mirror-reference-component.mjs

Regenerate explicitly (no lifecycle magic):

    cd packages/reference-neo && node tools/mirror-reference-component.mjs

This directory is gitignored. Do not edit files here directly.
Edit the reference-lib source and re-run the mirror tool.
`

/**
 * @typedef {object} SourceFile
 * @property {string} sourcePath
 * @property {string} relativePath
 * @property {string} sourceOfTruth
 */

/**
 * @param {string} rootDir
 * @param {string} [relativeDir]
 * @returns {Promise<SourceFile[]>}
 */
async function listFiles(rootDir, relativeDir = '') {
  const dirPath = join(rootDir, relativeDir)
  const entries = await readdir(dirPath, { withFileTypes: true })
  /** @type {SourceFile[]} */
  const files = []

  for (const entry of entries) {
    const nextRelative = relativeDir ? join(relativeDir, entry.name) : entry.name
    if (entry.isDirectory()) {
      files.push(...(await listFiles(rootDir, nextRelative)))
      continue
    }

    files.push({
      sourcePath: join(rootDir, nextRelative),
      relativePath: nextRelative,
      sourceOfTruth: nextRelative,
    })
  }

  return files
}

/**
 * @returns {Promise<SourceFile[]>}
 */
async function listLivingFiles() {
  /** @type {SourceFile[]} */
  const files = []
  for (const root of MIRROR_ROOTS) {
    for (const file of await listFiles(join(SOURCE_DIR, root))) {
      const relativePath = join(root, file.relativePath)
      files.push({
        sourcePath: file.sourcePath,
        relativePath,
        sourceOfTruth: join(
          'packages',
          'reference-lib',
          'src',
          'components',
          'Reference',
          relativePath
        ),
      })
    }
  }
  return files
}

/**
 * @param {string} relativePath
 * @param {string} source
 * @returns {string}
 */
function rewriteTypesImports(relativePath, source) {
  const adapterImportPath = getAdapterImportPath(relativePath)
  return source.replace(/from '@reference-ui\/types'/g, `from '${adapterImportPath}'`)
}

/**
 * @param {string} relativePath
 * @param {string} source
 */
function ensureNoTypesPackageImports(relativePath, source) {
  if (source.includes('@reference-ui/types')) {
    throw new Error(`Unhandled @reference-ui/types import rewrite in ${relativePath}`)
  }
}

/**
 * @param {string} source
 * @param {string} sourceOfTruth
 * @returns {string}
 */
function addSourceComment(source, sourceOfTruth) {
  const comment = [
    '// @ts-nocheck',
    '',
    '/**',
    ` * Source of truth: ${sourceOfTruth}`,
    ' * This file is mirrored into reference-neo by tools/mirror-reference-component.mjs.',
    ' * Edit the reference-lib source, not this copy.',
    ' */',
    '',
  ].join('\n')

  return `${comment}${source}`
}

/**
 * @param {string} relativePath
 * @returns {string}
 */
function getAdapterImportPath(relativePath) {
  const targetFilePath = join(TARGET_DIR, relativePath)
  const importPath = relative(dirname(targetFilePath), TYPES_ADAPTER_FILE)
    .replace(/\\/g, '/')
    .replace(/\.ts$/, '')

  return importPath.startsWith('.') ? importPath : `./${importPath}`
}

/**
 * @param {SourceFile} file
 */
async function writeMirroredFile(file) {
  const targetPath = join(TARGET_DIR, file.relativePath)
  await mkdir(dirname(targetPath), { recursive: true })

  const original = await readFile(file.sourcePath, 'utf8')
  const rewritten = rewriteTypesImports(file.relativePath, original)
  ensureNoTypesPackageImports(file.relativePath, rewritten)
  await writeFile(targetPath, addSourceComment(rewritten, file.sourceOfTruth))
}

function delay(milliseconds) {
  return new Promise(resolve => delayTimeout(resolve, milliseconds))
}

async function withLock(callback) {
  const attempts = 120

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let handle

    try {
      handle = await open(LOCK_FILE, 'wx')
      try {
        return await callback()
      } finally {
        await handle.close()
        await unlink(LOCK_FILE).catch(() => {})
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'EEXIST'
      ) {
        await delay(100)
        continue
      }

      throw error
    }
  }

  throw new Error(`Timed out waiting for lock ${LOCK_FILE}`)
}

async function main() {
  await withLock(async () => {
    const sourceFiles = await listLivingFiles()

    await rm(TARGET_DIR, { recursive: true, force: true })
    await mkdir(TARGET_DIR, { recursive: true })
    await writeFile(join(TARGET_DIR, 'README.md'), GENERATED_README)

    for (const file of sourceFiles) {
      if (file.relativePath.endsWith('.md')) {
        continue
      }
      await writeMirroredFile(file)
    }

    console.log(`Mirrored ${sourceFiles.length} reference component files into ${TARGET_DIR}`)
  })
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
