import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []
const BASE_SYSTEM_PREFIX = 'export const baseSystem = '

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-system-base-'))
  createdDirs.push(dir)
  return dir
}

function readBaseSystemFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const index = content.indexOf(BASE_SYSTEM_PREFIX)
  if (index === -1) {
    throw new Error(`baseSystem export prefix missing in ${filePath}`)
  }

  return {
    content,
    json: JSON.parse(content.slice(index + BASE_SYSTEM_PREFIX.length)),
  }
}

async function importCreateModule(options: {
  outDir: string
  fragmentBundle?: string
  preparedFragments?: {
    upstreamFragments: string[]
    localFragmentBundles: Array<{ bundle: string }>
  }
}) {
  vi.resetModules()

  const debug = vi.fn()
  const writeGeneratedSystemFontTypes = vi.fn().mockResolvedValue(undefined)
  const prepareBaseFragments = vi.fn().mockResolvedValue(
    options.preparedFragments ?? {
      upstreamFragments: [';upstreamFragment()'],
      localFragmentBundles: [{ bundle: 'localFragment()' }],
    }
  )
  const createCollectorBundleFromBase = vi.fn().mockResolvedValue({
    collectorFragments: 'collectorFragments()',
    getValue: vi.fn((name: string) => `get:${name}`),
  })
  const createPortableBaseFragmentBundle = vi.fn(() => options.fragmentBundle ?? ';upstreamFragment()\n;localFragment()')

  vi.doMock('../../lib/paths', () => ({
    getOutDirPath: () => options.outDir,
  }))
  vi.doMock('../../lib/log', () => ({
    log: { debug },
  }))
  vi.doMock('../types/generate', () => ({
    writeGeneratedSystemFontTypes,
  }))
  vi.doMock('./fragments', () => ({
    prepareBaseFragments,
    createCollectorBundleFromBase,
    createPortableBaseFragmentBundle,
  }))

  const mod = await import('./create')
  return {
    ...mod,
    debug,
    writeGeneratedSystemFontTypes,
    prepareBaseFragments,
    createCollectorBundleFromBase,
    createPortableBaseFragmentBundle,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../lib/paths')
  vi.doUnmock('../../lib/log')
  vi.doUnmock('../types/generate')
  vi.doUnmock('./fragments')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/base/create', () => {
  it('writes baseSystem artifacts with config name and portable fragment bundle', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const baseSystemPath = join(outDir, 'system', 'baseSystem.mjs')
    const baseSystemTypesPath = join(outDir, 'system', 'baseSystem.d.mts')

    const { createBaseArtifacts, writeGeneratedSystemFontTypes } = await importCreateModule({ outDir })

    const result = await createBaseArtifacts(workspaceDir, {
      name: 'release-ready-system',
      include: ['src/**/*.{ts,tsx}'],
    } as never)

    expect(result.baseSystem).toEqual({
      name: 'release-ready-system',
      fragment: ';upstreamFragment()\n;localFragment()',
    })
    expect(readBaseSystemFile(baseSystemPath).json).toEqual({
      name: 'release-ready-system',
      fragment: ';upstreamFragment()\n;localFragment()',
    })
    expect(readFileSync(baseSystemTypesPath, 'utf-8')).toContain('export declare const baseSystem: BaseSystem')
    expect(writeGeneratedSystemFontTypes).toHaveBeenCalledWith(
      workspaceDir,
      ';upstreamFragment()\n;localFragment()'
    )
  })

  it('attaches css to baseSystem without corrupting existing fields', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const baseSystemPath = join(outDir, 'system', 'baseSystem.mjs')

    const { createBaseArtifacts, updateBaseSystemCss } = await importCreateModule({ outDir })

    await createBaseArtifacts(workspaceDir, {
      name: 'layered-system',
      include: ['src/**/*.{ts,tsx}'],
    } as never)

    updateBaseSystemCss(workspaceDir, '@layer layered-system { .x { color: red; } }')

    expect(readBaseSystemFile(baseSystemPath).json).toEqual({
      name: 'layered-system',
      fragment: ';upstreamFragment()\n;localFragment()',
      css: '@layer layered-system { .x { color: red; } }',
    })
  })

  it('reruns deterministically for the same config and fragments', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const baseSystemPath = join(outDir, 'system', 'baseSystem.mjs')
    const baseSystemTypesPath = join(outDir, 'system', 'baseSystem.d.mts')

    const { createBaseArtifacts } = await importCreateModule({ outDir })
    const config = {
      name: 'deterministic-system',
      include: ['src/**/*.{ts,tsx}'],
    } as never

    await createBaseArtifacts(workspaceDir, config)
    const firstBaseSystem = readFileSync(baseSystemPath, 'utf-8')
    const firstTypes = readFileSync(baseSystemTypesPath, 'utf-8')

    await createBaseArtifacts(workspaceDir, config)
    const secondBaseSystem = readFileSync(baseSystemPath, 'utf-8')
    const secondTypes = readFileSync(baseSystemTypesPath, 'utf-8')

    expect(secondBaseSystem).toBe(firstBaseSystem)
    expect(secondTypes).toBe(firstTypes)
  })

  it('leaves malformed baseSystem files untouched when the expected export is missing', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const systemDir = join(outDir, 'system')
    const baseSystemPath = join(systemDir, 'baseSystem.mjs')

    const { updateBaseSystemCss } = await importCreateModule({ outDir })

    rmSync(systemDir, { recursive: true, force: true })
    const fs = await import('node:fs')
    fs.mkdirSync(systemDir, { recursive: true })
    fs.writeFileSync(baseSystemPath, 'export const nope = {}', 'utf-8')

    expect(() => updateBaseSystemCss(workspaceDir, '@layer x {}')).not.toThrow()
    expect(readFileSync(baseSystemPath, 'utf-8')).toBe('export const nope = {}')
  })
})
