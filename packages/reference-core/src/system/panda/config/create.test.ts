import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../../constants'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-panda-config-create-'))
  createdDirs.push(dir)
  return dir
}

async function importCreateModule(template?: string) {
  vi.resetModules()

  const loadTemplates = vi.fn(() => ({
    panda:
      template ??
      [
        'BASE={{ baseConfigLiteral }}',
        'COLLECTORS={{ collectorFragments }}',
        'TOKENS={{ tokensValueExpression }}',
        'KEYFRAMES={{ keyframesValueExpression }}',
        'FONT={{ fontValueExpression }}',
        'GLOBAL={{ globalCssValueExpression }}',
        'PATTERNS={{ patternsValueExpression }}',
        'EXTENSIONS={{ extensionsImportPath }}',
      ].join('\n'),
  }))

  vi.doMock('./liquid', () => ({
    loadTemplates,
  }))

  const mod = await import('./create')
  return { ...mod, loadTemplates }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./liquid')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/panda/config/create', () => {
  it('writes panda.config.ts with rendered collector expressions and extensions import', async () => {
    const tempDir = createTempDir()
    const outputPath = resolve(tempDir, DEFAULT_OUT_DIR, 'panda.config.ts')

    const { createPandaConfig } = await importCreateModule()

    await createPandaConfig({
      outputPath,
      collectorBundle: {
        collectorFragments: 'collectorFragments()',
        getValue: (name: string) => `getValue:${name}`,
      } as never,
      extensionsImportPath: './styled/extensions/index.mjs',
    })

    const output = readFileSync(outputPath, 'utf-8')

    expect(output).toContain('COLLECTORS=collectorFragments()')
    expect(output).toContain('TOKENS=getValue:tokens')
    expect(output).toContain('KEYFRAMES=getValue:keyframes')
    expect(output).toContain('FONT=getValue:font')
    expect(output).toContain('GLOBAL=getValue:globalCss')
    expect(output).toContain('PATTERNS=getValue:box-pattern')
    expect(output).toContain('EXTENSIONS=./styled/extensions/index.mjs')
    expect(output).toContain('"outdir": "styled"')
  })

  it('renders a provided baseConfig override instead of the default base config', async () => {
    const tempDir = createTempDir()
    const outputPath = resolve(tempDir, DEFAULT_OUT_DIR, 'panda.config.ts')

    const { createPandaConfig } = await importCreateModule('BASE={{ baseConfigLiteral }}')

    await createPandaConfig({
      outputPath,
      collectorBundle: {
        collectorFragments: '',
        getValue: () => 'unused',
      } as never,
      baseConfig: {
        include: ['custom/**/*'],
        outdir: 'custom-styled',
      },
      extensionsImportPath: './styled/extensions/index.mjs',
    })

    const output = readFileSync(outputPath, 'utf-8')

    expect(output).toContain('"include": [')
    expect(output).toContain('"custom/**/*"')
    expect(output).toContain('"outdir": "custom-styled"')
    expect(output).not.toContain('"outdir": "styled"')
  })

  it('produces identical panda.config.ts on rerun with same inputs', async () => {
    const tempDir = createTempDir()
    const outputPath = resolve(tempDir, DEFAULT_OUT_DIR, 'panda.config.ts')
    const { createPandaConfig } = await importCreateModule()

    const opts = {
      outputPath,
      collectorBundle: {
        collectorFragments: 'collectorFragments()',
        getValue: (name: string) => `getValue:${name}`,
      } as never,
      extensionsImportPath: './styled/extensions/index.mjs',
    }

    await createPandaConfig(opts)
    const first = readFileSync(outputPath, 'utf-8')
    await createPandaConfig(opts)
    const second = readFileSync(outputPath, 'utf-8')

    expect(second).toBe(first)
  })
})
