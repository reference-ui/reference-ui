import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../../constants'

const createdDirs: string[] = []
const NATIVE_STYLESHEET = '@layer reset, global, base, tokens, recipes, utilities;\n@layer utilities { .native_class { color: red; } }\n'

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-codegen-'))
  createdDirs.push(dir)
  return dir
}

async function withNativeEngine<T>(run: () => Promise<T>): Promise<T> {
  const prevEnv = process.env.REF_SYSTEM_ENGINE
  process.env.REF_SYSTEM_ENGINE = 'native'
  try {
    return await run()
  } finally {
    if (prevEnv !== undefined) {
      process.env.REF_SYSTEM_ENGINE = prevEnv
    } else {
      delete process.env.REF_SYSTEM_ENGINE
    }
  }
}

async function importCodegenModule(options: {
  cwd?: string
  outDir: string
  pandaGenerateThrow?: Error
  loadConfigThrow?: Error
  cssgenThrow?: Error
  layerCss?: string
  compileSync?: ReturnType<typeof vi.fn>
}) {
  vi.resetModules()
  const {
    outDir,
    pandaGenerateThrow,
    loadConfigThrow,
    cssgenThrow,
    layerCss = '',
    compileSync,
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
  const emitLog = vi.fn()

  vi.doMock('../../../config/store', () => ({
    getCwd: () => cwd,
    getConfig: () => (layerCss !== undefined ? { name: 'test' } : undefined),
  }))
  vi.doMock('../../../lib/paths', () => ({
    getOutDirPath: () => outDir,
  }))
  vi.doMock('../../../lib/log', () => ({
    log: { debug },
    emitLog,
  }))
  vi.doMock('@pandacss/node', () => ({
    generate: pandaGenerate,
    loadConfigAndCreateContext,
    cssgen: pandaCssgen,
  }))
  vi.doMock('../../base/create', () => ({
    updateBaseSystemCss,
  }))
  vi.doMock('../../stylesheet/postprocess', () => ({
    PANDA_GLOBAL_CSS_FILENAME: 'global.css',
    postprocessCss,
  }))
  if (compileSync) {
    vi.doMock('@reference-ui/rust/system', () => ({
      compileSync,
    }))
  }

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
  vi.doUnmock('../../stylesheet/postprocess')
  vi.doUnmock('@reference-ui/rust/system')
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
    vi.doMock('../../stylesheet/postprocess', () => ({
      PANDA_GLOBAL_CSS_FILENAME: 'global.css',
      postprocessCss: vi.fn(),
    }))

    const { runPandaCodegen } = await import('./codegen')
    await expect(runPandaCodegen()).rejects.toThrow('runPandaCodegen: getCwd() is undefined')
  })

  it('runPandaCodegen throws when panda.config.ts is absent', async () => {
    const workspaceDir = createTempDir()
    const outDir = join(workspaceDir, DEFAULT_OUT_DIR)
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
    vi.doMock('../../stylesheet/postprocess', () => ({
      PANDA_GLOBAL_CSS_FILENAME: 'global.css',
      postprocessCss: vi.fn(),
    }))

    const { runPandaCss } = await import('./codegen')
    await expect(runPandaCss()).rejects.toThrow('runPandaCss: getCwd() is undefined')
  })

  it('runPandaCss throws when panda.config.ts is absent', async () => {
    const workspaceDir = createTempDir()
    const outDir = join(workspaceDir, DEFAULT_OUT_DIR)
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

  it('writes native stylesheet and skips panda styles cssgen when native engine is set', async () => {
    const outDir = createTempDir()
    const configPath = join(outDir, 'panda.config.ts')
    writeFileSync(configPath, 'export default {}', 'utf-8')
    const stylesPath = join(outDir, 'styled', 'styles.css')

    const compileSyncMock = vi.fn(() => ({ stylesheet: NATIVE_STYLESHEET }))

    await withNativeEngine(async () => {
      const {
        runPandaCodegen,
        pandaGenerate,
        pandaCssgen,
        postprocessCss,
        updateBaseSystemCss,
      } = await importCodegenModule({ outDir, compileSync: compileSyncMock })

      await runPandaCodegen()

      expect(pandaGenerate).toHaveBeenCalledWith({ cwd: outDir }, configPath)
      expect(pandaCssgen).toHaveBeenCalledTimes(1)
      expect(pandaCssgen).not.toHaveBeenCalledWith({}, { cwd: outDir })
      expect(pandaCssgen).toHaveBeenCalledWith({}, {
        cwd: outDir,
        type: 'global',
        outfile: join(outDir, 'styled', 'global.css'),
      })
      expect(compileSyncMock).toHaveBeenCalledWith({ rootDir: outDir })
      expect(readFileSync(stylesPath, 'utf-8')).toBe(NATIVE_STYLESHEET)
      expect(readFileSync(stylesPath, 'utf-8')).not.toContain('/* panda baseline */')
      // Atomic preamble is 6 layers; Panda postprocess expects the 5-layer sheet.
      expect(postprocessCss).not.toHaveBeenCalled()
      expect(updateBaseSystemCss).not.toHaveBeenCalled()
    })
  })

  it('fails cssgen when native engine compile throws', async () => {
    const outDir = createTempDir()
    writeFileSync(join(outDir, 'panda.config.ts'), 'export default {}', 'utf-8')
    const compileSyncMock = vi.fn(() => {
      throw new Error('native boom')
    })

    await withNativeEngine(async () => {
      const { runPandaCss, postprocessCss } = await importCodegenModule({
        outDir,
        compileSync: compileSyncMock,
      })

      await expect(runPandaCss()).rejects.toThrow('native boom')
      expect(postprocessCss).not.toHaveBeenCalled()
    })
  })
})
