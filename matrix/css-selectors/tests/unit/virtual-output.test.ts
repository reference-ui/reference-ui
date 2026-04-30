import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const refUiDir = join(process.cwd(), '.reference-ui')

async function waitForGeneratedFile(relativePath: string, maxMs = 45_000): Promise<string> {
  const absolutePath = join(refUiDir, relativePath)
  const startedAt = Date.now()

  while (Date.now() - startedAt < maxMs) {
    if (existsSync(absolutePath)) {
      return readFileSync(absolutePath, 'utf-8')
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Expected generated file ${relativePath} within ${maxMs}ms`)
}

const generatedOutput = {
  virtualSource: '',
  referenceUiArtifact: '',
}

beforeAll(async () => {
  generatedOutput.virtualSource = await waitForGeneratedFile(join('virtual', 'src', 'styles.ts'))
  generatedOutput.referenceUiArtifact = await waitForGeneratedFile(
    join('virtual', '__reference__ui', 'src', 'styles.js'),
  )
})

describe('css selectors matrix virtual output', () => {
  it('neutralizes Panda-visible style calls in the user virtual source copy', () => {
    expect(generatedOutput.virtualSource).toContain("import { css } from 'src/system/css';")
    expect(generatedOutput.virtualSource).toContain("import { cva } from 'src/system/css';")
    expect(generatedOutput.virtualSource).toContain('const __reference_ui_css = css;')
    expect(generatedOutput.virtualSource).toContain('const __reference_ui_cva = cva;')
    expect(generatedOutput.virtualSource).toContain('__reference_ui_css({')
    expect(generatedOutput.virtualSource).toContain('__reference_ui_cva({')
    expect(generatedOutput.virtualSource).not.toContain("import { css } from '@reference-ui/react'")
    expect(generatedOutput.virtualSource).not.toContain('recipe(')
  })

  it('keeps __reference__ui artifact imports rewritten while preserving raw Panda-readable calls', () => {
    expect(generatedOutput.referenceUiArtifact).toContain("import { css } from 'src/system/css';")
    expect(generatedOutput.referenceUiArtifact).toContain("import { cva } from 'src/system/css';")
    expect(generatedOutput.referenceUiArtifact).toContain('css({')
    expect(generatedOutput.referenceUiArtifact).toContain('cva({')
    expect(generatedOutput.referenceUiArtifact).not.toContain('__reference_ui_css')
    expect(generatedOutput.referenceUiArtifact).not.toContain('__reference_ui_cva')
    expect(generatedOutput.referenceUiArtifact).not.toContain("@reference-ui/react")
  })
})