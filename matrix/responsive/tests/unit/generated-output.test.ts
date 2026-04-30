import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

const refUiDir = join(process.cwd(), '.reference-ui')
const suspiciousStylesheetFragments = ['[object Object]', 'undefined', 'NaN', '\u0000', '\uFFFD'] as const

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
  reactStylesheet: '',
  reactStylesheetAst: null as Root | null,
}

function collectMalformedContainerParams(): string[] {
  const malformed: string[] = []

  generatedOutput.reactStylesheetAst?.walkAtRules('container', (atRule) => {
    if (atRule.params.trim().startsWith('true')) {
      malformed.push(atRule.params)
    }
  })

  return malformed
}

beforeAll(async () => {
  const reactStylesheet = await waitForGeneratedFile(join('react', 'styles.css'))

  generatedOutput.reactStylesheet = reactStylesheet
  generatedOutput.reactStylesheetAst = postcss.parse(reactStylesheet, {
    from: join(refUiDir, 'react', 'styles.css'),
  })
})

describe('responsive generated output', () => {
  it('parses generated react/styles.css without syntax errors', () => {
    expect(generatedOutput.reactStylesheetAst).toBeTruthy()
    expect(generatedOutput.reactStylesheetAst?.nodes.length ?? 0).toBeGreaterThan(0)
  })

  it('keeps standard declarations in generated react/styles.css non-empty', () => {
    const invalidDeclarations: string[] = []
    let declarationCount = 0

    generatedOutput.reactStylesheetAst?.walkDecls((decl) => {
      declarationCount += 1

      if (decl.prop.trim().length === 0) {
        invalidDeclarations.push(`${decl.prop}:${decl.value}`)
        return
      }

      if (!decl.prop.startsWith('--') && decl.value.trim().length === 0) {
        invalidDeclarations.push(`${decl.prop}:${decl.value}`)
      }
    })

    expect(declarationCount).toBeGreaterThan(0)
    expect(invalidDeclarations).toEqual([])
  })

  it('keeps suspicious placeholder fragments out of generated react/styles.css', () => {
    const foundFragments = suspiciousStylesheetFragments.filter((fragment) =>
      generatedOutput.reactStylesheet.includes(fragment),
    )

    expect(generatedOutput.reactStylesheet.length).toBeGreaterThan(0)
    expect(foundFragments).toEqual([])
  })

  it('does not emit malformed @container parameters', () => {
    expect(collectMalformedContainerParams()).toEqual([])
  })
})