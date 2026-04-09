import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-codegen-'))
  createdDirs.push(dir)
  return dir
}

async function importCodegenModule(options: {
  cwd?: string
  outDir: string
  pandaGenerateThrow?: Error
  loadConfigThrow?: Error
  cssgenThrow?: Error
  layerCss?: string
}) {
  vi.resetModules()
  const {
    outDir,
    pandaGenerateThrow,
    loadConfigThrow,
    cssgenThrow,
    layerCss = '',
  } = options
  const cwd = options.cwd ?? outDir

  const pandaGenerate = vi.fn(async () => {
    if (pandaGenerateThrow) throw pandaGenerateThrow
  })
  const loadConfigAndCreateContext = vi.fn(async () => {
    if (loadConfigThrow) throw loadConfigThrow
    return {} as never
  })
  const pandaCssgen = vi.fn(async () => {
    if (cssgenThrow) throw cssgenThrow
  })
  const updateBaseSystemCss = vi.fn()
  const postprocessCss = vi.fn(() => layerCss)
  const debug = vi.fn()

  vi.doMock('../../../config/store', () => ({
    getCwd: () => cwd,
    getConfig: () => (layerCss !== undefined ? { name: 'test' } : undefined),
  }))
  vi.doMock('../../../lib/paths', () => ({
    getOutDirPath: () => outDir,
  }))
  vi.doMock('../../../lib/log', () => ({
    log: { debug },
  }))
  vi.doMock('@pandacss/node', () => ({
    generate: pandaGenerate,
    loadConfigAndCreateContext,
    cssgen: pandaCssgen,
  }))
  vi.doMock('../../base/create', () => ({
    updateBaseSystemCss,
  }))
  vi.doMock('../../css/postprocess', () => ({
    PANDA_GLOBAL_CSS_FILENAME: 'global.css',
    postprocessCss,
  }))

  const mod = await import('./codegen')
  return {
    ...mod,
    pandaGenerate,
    loadConfigAndCreateContext,
    pandaCssgen,
    updateBaseSystemCss,
    postprocessCss,
    debug,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../config/store')
  vi.doUnmock('../../../lib/paths')
  vi.doUnmock('../../../lib/log')
  vi.doUnmock('@pandacss/node')
  vi.doUnmock('../../base/create')
  vi.doUnmock('../../css/postprocess')
  vi.restoreAllMocks()
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/panda/gen/codegen', () => {
  it('runPandaCodegen throws when getCwd() is undefined', async () => {
    const outDir = createTempDir()
    vi.resetModules()
    vi.doMock('../../../config/store', () => ({
      getCwd: () => undefined,
      getConfig: () => ({ name: 'test' }),
    }))
    vi.doMock('../../../lib/paths', () => ({ getOutDirPath: () => outDir }))
    vi.doMock('../../../lib/log', () => ({ log: { debug: vi.fn() } }))
    vi.doMock('@pandacss/node', () => ({
      generate: vi.fn(),
      loadConfigAndCreateContext: vi.fn(),
      cssgen: vi.fn(),
    }))
    vi.doMock('../../base/create', () => ({ updateBaseSystemCss: vi.fn() }))
    vi.doMock('../../css/postprocess', () => ({
      PANDA_GLOBAL_CSS_FILENAME: 'global.css',
      postprocessCss: vi.fn(),
    }))

    const { runPandaCodegen } = await import('./codegen')
    await expect(runPandaCodegen()).rejects.toThrow('runPandaCodegen: getCwd() is undefined')
  })

  it('runPandaCodegen throws when panda.config.ts is absent', async () => {
    const workspaceDir = createTempDir()
    const outDir = join(workspaceDir, '.reference-ui')
    const { runPandaCodegen } = await importCodegenModule({
      cwd: workspaceDir,
      outDir,
    })
    const fs = await import('node:fs')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    const configPath = join(outDir, 'panda.config.ts')
    expect(fs.existsSync(configPath)).toBe(false)

    await expect(runPandaCodegen()).rejects.toThrow(
      'panda.config.ts not found at'
    )
  })

  it('runPandaCodegen calls pandaGenerate with outDir and configPath', async () => {
    const outDir = createTempDir()
    const configPath = join(outDir, 'panda.config.ts')
    writeFileSync(configPath, 'export default {}', 'utf-8')

    const {
      runPandaCodegen,
      pandaGenerate,
      loadConfigAndCreateContext,
      pandaCssgen,
    } = await importCodegenModule({ outDir })

    await runPandaCodegen()

    expect(pandaGenerate).toHaveBeenCalledWith(
      { cwd: outDir },
      configPath
    )
    expect(loadConfigAndCreateContext).toHaveBeenCalledWith({
      config: { cwd: outDir },
      configPath,
    })
    expect(pandaCssgen).toHaveBeenCalledWith({}, { cwd: outDir })
    expect(pandaCssgen).toHaveBeenCalledWith({}, {
      cwd: outDir,
      type: 'global',
      outfile: join(outDir, 'styled', 'global.css'),
    })
  })

  it('runPandaCodegen calls updateBaseSystemCss when postprocessCss returns portable css', async () => {
    const outDir = createTempDir()
    const configPath = join(outDir, 'panda.config.ts')
    writeFileSync(configPath, 'export default {}', 'utf-8')
    const layerCss = '@layer test { .x {} }'

    const { runPandaCodegen, updateBaseSystemCss, postprocessCss } =
      await importCodegenModule({ outDir, layerCss })

    await runPandaCodegen()

    expect(postprocessCss).toHaveBeenCalledWith(outDir, { name: 'test' })
    expect(updateBaseSystemCss).toHaveBeenCalledWith(outDir, layerCss)
  })

  it('runPandaCodegen does not call updateBaseSystemCss when postprocessCss returns empty', async () => {
    const outDir = createTempDir()
    const configPath = join(outDir, 'panda.config.ts')
    writeFileSync(configPath, 'export default {}', 'utf-8')

    const { runPandaCodegen, updateBaseSystemCss } = await importCodegenModule({
      outDir,
      layerCss: '',
    })

    await runPandaCodegen()

    expect(updateBaseSystemCss).not.toHaveBeenCalled()
  })

  it('runPandaCss throws when getCwd() is undefined', async () => {
    const outDir = createTempDir()
    vi.resetModules()
    vi.doMock('../../../config/store', () => ({
      getCwd: () => undefined,
      getConfig: () => ({ name: 'test' }),
    }))
    vi.doMock('../../../lib/paths', () => ({ getOutDirPath: () => outDir }))
    vi.doMock('../../../lib/log', () => ({ log: { debug: vi.fn() } }))
    vi.doMock('@pandacss/node', () => ({
      loadConfigAndCreateContext: vi.fn().mockResolvedValue({}),
      cssgen: vi.fn(),
    }))
    vi.doMock('../../base/create', () => ({ updateBaseSystemCss: vi.fn() }))
    vi.doMock('../../css/postprocess', () => ({
      PANDA_GLOBAL_CSS_FILENAME: 'global.css',
      postprocessCss: vi.fn(),
    }))

    const { runPandaCss } = await import('./codegen')
    await expect(runPandaCss()).rejects.toThrow('runPandaCss: getCwd() is undefined')
  })

  it('runPandaCss throws when panda.config.ts is absent', async () => {
    const workspaceDir = createTempDir()
    const outDir = join(workspaceDir, '.reference-ui')
    const fs = await import('node:fs')
    fs.mkdirSync(outDir, { recursive: true })

    const { runPandaCss } = await importCodegenModule({
      cwd: workspaceDir,
      outDir,
    })

    await expect(runPandaCss()).rejects.toThrow(
      'panda.config.ts not found at'
    )
  })

  it('runPandaCss does not call pandaGenerate', async () => {
    const outDir = createTempDir()
    const configPath = join(outDir, 'panda.config.ts')
    writeFileSync(configPath, 'export default {}', 'utf-8')

    const { runPandaCss, pandaGenerate, loadConfigAndCreateContext, pandaCssgen } =
      await importCodegenModule({ outDir })

    await runPandaCss()

    expect(pandaGenerate).not.toHaveBeenCalled()
    expect(loadConfigAndCreateContext).toHaveBeenCalled()
    expect(pandaCssgen).toHaveBeenCalledTimes(2)
    expect(pandaCssgen).toHaveBeenNthCalledWith(1, {}, { cwd: outDir })
    expect(pandaCssgen).toHaveBeenNthCalledWith(2, {}, {
      cwd: outDir,
      type: 'global',
      outfile: join(outDir, 'styled', 'global.css'),
    })
  })
})
