import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { createPandaConfig } from '../create'
import { DEFAULT_OUT_DIR } from '../../../../constants'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-panda-config-r-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('panda.liquid r/breakpoints wiring', () => {
  it('renders createRExtension call wired to the resolved breakpoint table', async () => {
    const tempDir = createTempDir()
    const outputPath = resolve(tempDir, DEFAULT_OUT_DIR, 'panda.config.ts')

    await createPandaConfig({
      outputPath,
      collectorBundle: {
        collectorFragments: '',
        values: [],
        getValue: (name: string) => (name === 'box-pattern' ? '[]' : '[]'),
      },
      extensionsImportPath: './styled/extensions/index.mjs',
    })

    const output = readFileSync(outputPath, 'utf-8')

    expect(output).toContain('createRExtension')
    expect(output).toContain('extractBreakpointTable')
    expect(output).toMatch(
      /const breakpointTable = extractBreakpointTable\(tokensFragments\)/
    )
    expect(output).toMatch(
      /const responsiveExtension = createRExtension\(breakpointTable\)/
    )
    expect(output).toMatch(
      /extendPatterns\(\s*\[responsiveExtension, \.\.\.patternExtensions, \.\.\.fontPatternExtensions\]/
    )
  })
})
