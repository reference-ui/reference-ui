import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { DEFAULT_EXTERNALS, microBundle } from '../../lib/microbundle'
import { scanForFragments } from '../../lib/fragments/scanner'
import { log } from '../../lib/log'
import { applyTransforms } from '../transforms'

const REFERENCE_UI_IMPORT = '@reference-ui/react'
const VIRTUAL_STYLE_COLLECTION_DIR = '__reference__ui'
const STYLE_CALL_PATTERN = /\b(?:css|recipe|cva)\s*\(/
const SUPPORTED_SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])
const STYLE_BUNDLE_EXTERNALS = [
  ...DEFAULT_EXTERNALS,
  REFERENCE_UI_IMPORT,
  '@reference-ui/system',
  'react',
  'react/jsx-runtime',
  'react-dom',
] as const

function isSupportedSourceFile(filePath: string): boolean {
  return SUPPORTED_SOURCE_EXTENSIONS.has(extname(filePath))
}

async function hasStyleCalls(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return STYLE_CALL_PATTERN.test(content)
  } catch {
    return false
  }
}

function toArtifactPath(root: string, virtualDir: string, sourcePath: string): string {
  const relativePath = relative(root, sourcePath)
  const extension = extname(relativePath)
  const withoutExtension = relativePath.slice(0, -extension.length)
  return join(virtualDir, VIRTUAL_STYLE_COLLECTION_DIR, `${withoutExtension}.js`)
}

async function listStyleSourceFiles(root: string, include: string[]): Promise<string[]> {
  const candidates = scanForFragments({
    include,
    importFrom: REFERENCE_UI_IMPORT,
    cwd: root,
  }).filter(isSupportedSourceFile)

  const matches = await Promise.all(
    candidates.map(async file => ((await hasStyleCalls(file)) ? file : null))
  )

  return matches.filter((file): file is string => typeof file === 'string')
}

async function bundleStyleSource(sourcePath: string): Promise<string> {
  return microBundle(sourcePath, {
    format: 'esm',
    external: [...STYLE_BUNDLE_EXTERNALS],
  })
}

/**
 * Build the reserved virtual style collection that Panda scans directly.
 *
 * Each collected module preserves raw `css()` / `recipe()` authoring surfaces
 * while inlining local constants through microbundle, then passes through the
 * standard virtual transform pipeline before being written under `__reference__ui`.
 */
export async function syncVirtualStyleCollection(options: {
  root: string
  virtualDir: string
  include: string[]
  breakpoints?: Record<string, string>
}): Promise<string[]> {
  const { root, virtualDir, include, breakpoints } = options
  const artifactRoot = join(virtualDir, VIRTUAL_STYLE_COLLECTION_DIR)

  await rm(artifactRoot, { recursive: true, force: true })

  const sourceFiles = await listStyleSourceFiles(root, include)
  if (sourceFiles.length === 0) {
    return []
  }

  const writtenPaths: string[] = []
  for (const sourceFile of sourceFiles) {
    const artifactPath = toArtifactPath(root, virtualDir, sourceFile)
    const bundled = await bundleStyleSource(sourceFile)
    const transformed = await applyTransforms({
      sourcePath: artifactPath,
      relativePath: relative(virtualDir, artifactPath),
      content: bundled,
      breakpoints,
    })
    await mkdir(dirname(artifactPath), { recursive: true })
    await writeFile(artifactPath, transformed.content, 'utf-8')
    writtenPaths.push(artifactPath)
  }

  log.debug('virtual', 'Synced virtual style collection', writtenPaths.length)
  return writtenPaths
}

export { VIRTUAL_STYLE_COLLECTION_DIR }