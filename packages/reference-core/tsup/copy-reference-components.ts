/**
 * Prebuild step: copy Reference UI frontend components from reference-lib into
 * reference-core's browser source directory.
 *
 * reference-lib/src/Reference/{components,document}/ is the single source of truth.
 * Do NOT edit the copied files under src/reference/browser/{components,document}/ —
 * they are overwritten on every build.
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CORE_PKG_DIR = join(__dirname, '..')
const LIB_REFERENCE_DIR = join(CORE_PKG_DIR, '../reference-lib/src/Reference')
const BROWSER_DIR = join(CORE_PKG_DIR, 'src/reference/browser')

/** Directories in reference-lib/src/Reference to sync into browser/. */
const SYNC_DIRS = ['components', 'document'] as const

/**
 * Value exports from `@reference-ui/types` that actually live in `browser/model/`
 * in reference-core. When detected in an import, they are split into a separate
 * model import rather than being bundled with the types import.
 */
const MODEL_VALUE_EXPORTS = new Set(['formatReferenceTypeParameter'])

/** Depth-correct relative path from a target file back to browser/types.ts. */
function resolveTypesImport(relativeToTarget: string): string {
  const depth = relativeToTarget.split('/').length - 1
  const up = Array.from({ length: depth }, () => '..').join('/')
  return `${up}/types`
}

/** Depth-correct relative path from a target file back to browser/model. */
function resolveModelImport(relativeToTarget: string): string {
  const depth = relativeToTarget.split('/').length - 1
  const up = Array.from({ length: depth }, () => '..').join('/')
  return `${up}/model`
}

/**
 * Rewrite package-level imports from `@reference-ui/types`:
 * - Named value exports that live in `model/` are split into a separate import
 * - All remaining named imports (types + type-only) stay in the types import
 */
function rewriteImports(content: string, relativeToTarget: string): string {
  const typesPath = resolveTypesImport(relativeToTarget)
  const modelPath = resolveModelImport(relativeToTarget)

  // Matches both `import { ... }` and `import type { ... }` from @reference-ui/types
  return content.replace(
    /import\s+(type\s+)?\{([^}]+)\}\s*from\s*'@reference-ui\/types'/g,
    (_match, typeModifier: string | undefined, namedImports: string) => {
      const isTypeOnlyImport = Boolean(typeModifier)
      const imports = namedImports
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      // Strip leading `type ` modifier for the lookup, but preserve the original token.
      // For a top-level `import type { ... }`, every member is already type-only.
      const modelImports = isTypeOnlyImport
        ? [] // type-only imports can't be model values
        : imports.filter((token) => MODEL_VALUE_EXPORTS.has(token.replace(/^type\s+/, '')))
      const typesImports = isTypeOnlyImport
        ? imports
        : imports.filter((token) => !MODEL_VALUE_EXPORTS.has(token.replace(/^type\s+/, '')))

      const lines: string[] = []
      if (modelImports.length > 0) {
        lines.push(`import { ${modelImports.join(', ')} } from '${modelPath}'`)
      }
      if (typesImports.length > 0) {
        const qualifier = isTypeOnlyImport ? 'type ' : ''
        lines.push(`import ${qualifier}{ ${typesImports.join(', ')} } from '${typesPath}'`)
      }
      return lines.join('\n')
    },
  )
}

function buildHeader(sourceRelative: string): string {
  return [
    `// This component is copied from reference-lib, do not modify here.`,
    `// Source: packages/reference-lib/src/Reference/${sourceRelative}`,
    ``,
  ].join('\n')
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else {
      files.push(full)
    }
  }

  return files
}

/** Files inside a sync target dir that are owned by reference-core and must not be wiped. */
const PRESERVE_FILES: Record<(typeof SYNC_DIRS)[number], string[]> = {
  components: ['index.ts'],
  document: [],
}

/** Snapshot and return the content of files that must survive a wipe. */
async function snapshotPreserved(
  targetDir: string,
  filenames: string[],
): Promise<Map<string, string>> {
  const preserved = new Map<string, string>()
  for (const filename of filenames) {
    try {
      preserved.set(filename, await readFile(join(targetDir, filename), 'utf8'))
    } catch {
      // File may not exist yet on first run — that's fine.
    }
  }
  return preserved
}

/** Write a single source file into the target directory with header + import rewrites. */
async function copySingleFile(sourceFile: string, targetRelative: string): Promise<void> {
  const sourceRelative = relative(LIB_REFERENCE_DIR, sourceFile)
  const targetFile = join(BROWSER_DIR, targetRelative)
  const raw = await readFile(sourceFile, 'utf8')
  const rewritten = rewriteImports(raw, targetRelative)
  await mkdir(dirname(targetFile), { recursive: true })
  await writeFile(targetFile, buildHeader(sourceRelative) + rewritten, 'utf8')
}

async function syncDir(syncDirName: (typeof SYNC_DIRS)[number]): Promise<void> {
  const sourceDir = join(LIB_REFERENCE_DIR, syncDirName)
  const targetDir = join(BROWSER_DIR, syncDirName)
  const preserveNames = PRESERVE_FILES[syncDirName]

  const preserved = await snapshotPreserved(targetDir, preserveNames)

  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })

  for (const [filename, content] of preserved) {
    await writeFile(join(targetDir, filename), content, 'utf8')
  }

  for (const sourceFile of await walk(sourceDir)) {
    const ext = sourceFile.slice(sourceFile.lastIndexOf('.'))
    if (ext !== '.ts' && ext !== '.tsx') continue

    const filename = sourceFile.slice(sourceFile.lastIndexOf('/') + 1)
    const isTopLevel = relative(sourceDir, sourceFile) === filename
    if (isTopLevel && preserveNames.includes(filename)) continue

    await copySingleFile(sourceFile, relative(LIB_REFERENCE_DIR, sourceFile))
  }
}

async function main(): Promise<void> {
  console.log('[copy-reference-components] syncing reference-lib → reference-core/browser')

  for (const dir of SYNC_DIRS) {
    await syncDir(dir)
    console.log(`  ✓ ${dir}/`)
  }

  console.log('[copy-reference-components] done')
}

main().catch((err) => {
  console.error('[copy-reference-components] failed:', err)
  process.exit(1)
})
