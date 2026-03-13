import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tempDirs: string[] = []

async function createWorkspace() {
  const root = await mkdtemp(join(tmpdir(), 'reference-ui-virtual-copy-'))
  tempDirs.push(root)

  const sourceDir = join(root, 'src')
  const virtualDir = join(root, '.reference-ui', 'virtual')

  await mkdir(sourceDir, { recursive: true })
  await mkdir(virtualDir, { recursive: true })

  return { root, sourceDir, virtualDir }
}

async function importCopyModule() {
  vi.resetModules()

  const transformFile = vi.fn()
  const debug = vi.fn()
  const error = vi.fn()

  vi.doMock('./transform', () => ({
    transformFile,
  }))
  vi.doMock('../lib/log', () => ({
    log: { debug, error, info: vi.fn() },
  }))

  const mod = await import('./copy')
  return { ...mod, transformFile, debug, error }
}

afterEach(async () => {
  vi.resetModules()
  vi.doUnmock('./transform')
  vi.doUnmock('../lib/log')
  vi.restoreAllMocks()

  await Promise.all(
    tempDirs.splice(0).map((dir) =>
      rm(dir, { recursive: true, force: true })
    )
  )
})

describe('virtual/copy', () => {
  it('copies non-transform files byte-for-byte', async () => {
    const { sourceDir, virtualDir } = await createWorkspace()
    const sourcePath = join(sourceDir, 'plain.txt')
    await writeFile(sourcePath, 'plain file\n', 'utf-8')

    const { copyToVirtual, transformFile } = await importCopyModule()

    const destPath = await copyToVirtual(sourcePath, sourceDir, virtualDir)

    expect(destPath).toBe(join(virtualDir, 'plain.txt'))
    expect(await readFile(destPath, 'utf-8')).toBe('plain file\n')
    expect(transformFile).not.toHaveBeenCalled()
  })

  it('transforms mdx files and writes the transformed extension', async () => {
    const { sourceDir, virtualDir } = await createWorkspace()
    const sourcePath = join(sourceDir, 'docs', 'guide.mdx')
    await mkdir(join(sourceDir, 'docs'), { recursive: true })
    await writeFile(sourcePath, '# Hello\n', 'utf-8')

    const { copyToVirtual, transformFile } = await importCopyModule()
    transformFile.mockResolvedValue({
      content: 'export default function Guide() { return null }\n',
      extension: '.jsx',
      transformed: true,
    })

    const destPath = await copyToVirtual(sourcePath, sourceDir, virtualDir)

    expect(destPath).toBe(join(virtualDir, 'docs', 'guide.jsx'))
    expect(await readFile(destPath, 'utf-8')).toContain('export default function Guide')
    expect(transformFile).toHaveBeenCalledWith({
      sourcePath,
      content: '# Hello\n',
      sourceDir,
      debug: undefined,
    })
  })

  it('only transforms supported source files when a rewrite marker is present', async () => {
    const { sourceDir, virtualDir } = await createWorkspace()
    const plainPath = join(sourceDir, 'Button.tsx')
    const markedPath = join(sourceDir, 'Recipe.tsx')

    await writeFile(plainPath, 'export const Button = () => null\n', 'utf-8')
    await writeFile(
      markedPath,
      "import { recipe } from '@reference-ui/react'\nexport const styles = recipe({})\n",
      'utf-8'
    )

    const { copyToVirtual, transformFile } = await importCopyModule()
    transformFile.mockResolvedValue({
      content: 'transformed recipe file\n',
      transformed: true,
    })

    const plainDest = await copyToVirtual(plainPath, sourceDir, virtualDir)
    const markedDest = await copyToVirtual(markedPath, sourceDir, virtualDir)

    expect(plainDest).toBe(join(virtualDir, 'Button.tsx'))
    expect(await readFile(plainDest, 'utf-8')).toBe('export const Button = () => null\n')
    expect(markedDest).toBe(join(virtualDir, 'Recipe.tsx'))
    expect(await readFile(markedDest, 'utf-8')).toBe('transformed recipe file\n')
    expect(transformFile).toHaveBeenCalledTimes(1)
    expect(transformFile).toHaveBeenCalledWith({
      sourcePath: markedPath,
      content: "import { recipe } from '@reference-ui/react'\nexport const styles = recipe({})\n",
      sourceDir,
      debug: undefined,
    })
  })

  it('removes both source-shaped and transformed virtual outputs', async () => {
    const { sourceDir, virtualDir } = await createWorkspace()
    const sourcePath = join(sourceDir, 'content', 'demo.mdx')
    const sourceShapedPath = join(virtualDir, 'content', 'demo.mdx')
    const transformedPath = join(virtualDir, 'content', 'demo.jsx')

    await mkdir(join(sourceDir, 'content'), { recursive: true })
    await mkdir(join(virtualDir, 'content'), { recursive: true })
    await writeFile(sourcePath, '# demo\n', 'utf-8')
    await writeFile(sourceShapedPath, '# stale\n', 'utf-8')
    await writeFile(transformedPath, 'export {}\n', 'utf-8')

    const { removeFromVirtual } = await importCopyModule()

    await removeFromVirtual(sourcePath, sourceDir, virtualDir)

    expect(existsSync(sourceShapedPath)).toBe(false)
    expect(existsSync(transformedPath)).toBe(false)
  })
})
