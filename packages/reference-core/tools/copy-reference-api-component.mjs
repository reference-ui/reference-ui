import { mkdir, open, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const CORE_DIR = join(SCRIPT_DIR, '..')
const REPO_DIR = join(CORE_DIR, '..', '..')
const SOURCE_DIR = join(REPO_DIR, 'packages', 'reference-lib', 'src', 'components', 'Reference')
const FONT_STACKS_SOURCE = join(REPO_DIR, 'packages', 'reference-lib', 'src', 'core', 'theme', 'fontStacks.ts')
const TARGET_DIR = join(CORE_DIR, 'src', 'reference', 'browser-component')
const TYPES_ADAPTER_FILE = join(CORE_DIR, 'src', 'reference', 'browser', 'component-api.ts')
const LOCK_FILE = join(CORE_DIR, '.copy-reference-api-component.lock')

const GENERATED_README = `# Browser Component Mirror

This directory is a mirrored component tree.

Source of truth:

- packages/reference-lib/src/components/Reference
- packages/reference-lib/src/core/theme/fontStacks.ts (for theme/fontStacks.ts)

These files are copied by:

- packages/reference-core/tools/copy-reference-api-component.mjs

In the monorepo this directory is gitignored; the workspace root \`prepare\` script runs
\`copy:reference-api-component\` after \`pnpm install\`, and \`prebuild\` / \`predev\` / \`pretypecheck\`
also run the same copy.

Do not edit files here directly. Edit the reference-lib source and re-run the copy script.
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
      files.push(...await listFiles(rootDir, nextRelative))
      continue
    }

    files.push({
      sourcePath: join(rootDir, nextRelative),
      relativePath: nextRelative,
      sourceOfTruth: join('packages', 'reference-lib', 'src', 'components', 'Reference', nextRelative),
    })
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
 * @returns {string}
 */
function rewriteThemeImports(relativePath, source) {
  if (relativePath !== 'theme/tokens.ts') return source
  return source.replace(
    "import { fontStacks } from '../../../core/theme/fontStacks'",
    "import { fontStacks } from './fontStacks'",
  )
}

/**
 * @param {string} relativePath
 * @param {string} source
 */
function ensureNoTypesPackageImports(relativePath, source) {
  if (source.includes("@reference-ui/types")) {
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
    ' * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.',
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
  const rewritten = rewriteThemeImports(file.relativePath, rewriteTypesImports(file.relativePath, original))
  ensureNoTypesPackageImports(file.relativePath, rewritten)
  await writeFile(targetPath, addSourceComment(rewritten, file.sourceOfTruth))
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
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
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
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
    const sourceFiles = await listFiles(SOURCE_DIR)
    /** @type {SourceFile[]} */
    const extraFiles = [
      {
        sourcePath: FONT_STACKS_SOURCE,
        relativePath: 'theme/fontStacks.ts',
        sourceOfTruth: 'packages/reference-lib/src/core/theme/fontStacks.ts',
      },
    ]

    await rm(TARGET_DIR, { recursive: true, force: true })
    await mkdir(TARGET_DIR, { recursive: true })
    await writeFile(join(TARGET_DIR, 'README.md'), GENERATED_README)

    for (const file of [...sourceFiles, ...extraFiles]) {
      await writeMirroredFile(file)
    }

    console.log(`Copied reference API component into ${TARGET_DIR}`)
  })
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})