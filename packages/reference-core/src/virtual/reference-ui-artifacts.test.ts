import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-virtual-artifacts-'))
  createdDirs.push(dir)
  return dir
}

async function importArtifactsModule(scannedFiles: string[], bundled = '// bundled output\n') {
  vi.resetModules()

  const scanForFragments = vi.fn(() => scannedFiles)
  const microBundle = vi.fn(async () => bundled)
  const applyTransforms = vi.fn(async (options: { content: string }) => ({
    content: `${options.content}// transformed\n`,
    transformed: true,
  }))
  const debug = vi.fn()

  vi.doMock('../lib/fragments/scanner', () => ({
    scanForFragments,
  }))
  vi.doMock('../lib/microbundle', () => ({
    DEFAULT_EXTERNALS: ['@pandacss/dev'],
    microBundle,
  }))
  vi.doMock('../lib/log', () => ({
    log: { debug, error: vi.fn(), info: vi.fn() },
  }))
  vi.doMock('./transforms', () => ({
    applyTransforms,
  }))

  const mod = await import('./reference-ui-artifacts')
  return { ...mod, scanForFragments, microBundle, applyTransforms, debug }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/fragments/scanner')
  vi.doUnmock('../lib/microbundle')
  vi.doUnmock('../lib/log')
  vi.doUnmock('./transforms')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('virtual/reference-ui-artifacts', () => {
  it('writes bundled raw style modules under virtual/__reference__ui and skips non-style files', async () => {
    const root = createTempDir()
    const virtualDir = join(root, '.reference-ui', 'virtual')
    const srcDir = join(root, 'src')
    mkdirSync(srcDir, { recursive: true })

    const styleFile = join(srcDir, 'styles.ts')
    const otherFile = join(srcDir, 'component.tsx')

    writeFileSync(styleFile, "import { css } from '@reference-ui/react'\nexport const x = css({ color: 'red' })\n")
    writeFileSync(otherFile, "import { Button } from '@reference-ui/react'\nexport const x = Button\n")

    const { writeReferenceUiVirtualArtifacts, scanForFragments, microBundle, applyTransforms } =
      await importArtifactsModule([styleFile, otherFile], "import { css } from '@reference-ui/react'\nconst x = css({ color: 'red' })\n")

    const written = await writeReferenceUiVirtualArtifacts({
      root,
      virtualDir,
      include: ['src/**/*.{ts,tsx}'],
    })

    const outputPath = join(virtualDir, '__reference__ui', 'src', 'styles.js')

    expect(scanForFragments).toHaveBeenCalledWith({
      include: ['src/**/*.{ts,tsx}'],
      importFrom: '@reference-ui/react',
      cwd: root,
    })
    expect(microBundle).toHaveBeenCalledTimes(1)
    expect(microBundle).toHaveBeenCalledWith(styleFile, {
      format: 'esm',
      external: ['@pandacss/dev', '@reference-ui/react', '@reference-ui/system', 'react', 'react/jsx-runtime', 'react-dom'],
    })
    expect(applyTransforms).toHaveBeenCalledWith({
      sourcePath: outputPath,
      relativePath: '__reference__ui/src/styles.js',
      content: "import { css } from '@reference-ui/react'\nconst x = css({ color: 'red' })\n",
    })
    expect(written).toEqual([outputPath])
    expect(readFileSync(outputPath, 'utf-8')).toContain('// transformed')
  })
})