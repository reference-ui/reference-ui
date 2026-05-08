import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

import { Index, matrixCssSelectorsMarker } from '../../src/index'
import { cssSelectorsMatrixClasses, selectorRecipe } from '../../src/styles'

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
  styledStylesheet: '',
  styledStylesheetAst: null as Root | null,
}

beforeAll(async () => {
  const styledStylesheet = await waitForGeneratedFile(join('styled', 'styles.css'))

  generatedOutput.styledStylesheet = styledStylesheet
  generatedOutput.styledStylesheetAst = postcss.parse(styledStylesheet, {
    from: join(refUiDir, 'styled', 'styles.css'),
  })
})

describe('css selectors matrix emitted output', () => {
  it('exports the matrix marker', () => {
    expect(matrixCssSelectorsMarker).toBe('reference-ui-matrix-css-selectors')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
    expect(element.props['data-testid']).toBe('css-selectors-root')
  })

  it('computes runtime class tokens for the selector probes', () => {
    for (const className of Object.values(cssSelectorsMatrixClasses)) {
      expect(className).toBeTruthy()
    }
  })

  it('computes stable runtime classes for recipe variants', () => {
    expect(selectorRecipe()).toBe(selectorRecipe())
    expect(selectorRecipe({ tone: 'interactive' })).toBe(selectorRecipe({ tone: 'interactive' }))
    expect(selectorRecipe({ tone: 'quiet' })).toBe(selectorRecipe({ tone: 'quiet' }))
    expect(selectorRecipe({ state: 'open' })).toBe(selectorRecipe({ state: 'open' }))
    expect(selectorRecipe({ tone: 'interactive', emphasis: 'strong' })).toBe(
      selectorRecipe({ tone: 'interactive', emphasis: 'strong' }),
    )
  })

  it('parses generated styled/styles.css without syntax errors', () => {
    expect(generatedOutput.styledStylesheetAst).toBeTruthy()
    expect(generatedOutput.styledStylesheetAst?.nodes.length ?? 0).toBeGreaterThan(0)
  })

  it('keeps standard declarations in generated styled/styles.css non-empty', () => {
    const invalidDeclarations: string[] = []
    let declarationCount = 0

    generatedOutput.styledStylesheetAst?.walkDecls((decl) => {
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

  it('keeps suspicious placeholder fragments out of generated styled/styles.css', () => {
    const foundFragments = suspiciousStylesheetFragments.filter((fragment) =>
      generatedOutput.styledStylesheet.includes(fragment),
    )

    expect(generatedOutput.styledStylesheet.length).toBeGreaterThan(0)
    expect(foundFragments).toEqual([])
  })
})