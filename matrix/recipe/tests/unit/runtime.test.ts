import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

import { Index, matrixRecipeMarker } from '../../src/index'
import { recipeMatrixButton, recipeMatrixConstants, recipeMatrixResponsiveCard } from '../../src/styles'

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

beforeAll(async () => {
  const reactStylesheet = await waitForGeneratedFile(join('react', 'styles.css'))

  generatedOutput.reactStylesheet = reactStylesheet
  generatedOutput.reactStylesheetAst = postcss.parse(reactStylesheet, {
    from: join(refUiDir, 'react', 'styles.css'),
  })
})

function stylesheetHasAtRuleDeclaration(
  name: string,
  paramFragment: string,
  prop: string,
  value: string,
): boolean {
  let found = false

  generatedOutput.reactStylesheetAst?.walkAtRules(name, (atRule) => {
    if (!atRule.params.includes(paramFragment) || found) {
      return
    }

    atRule.walkDecls(prop, (decl) => {
      if (decl.value.includes(value)) {
        found = true
      }
    })
  })

  return found
}

describe('recipe matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixRecipeMarker).toBe('reference-ui-matrix-recipe')
  })

  it('returns stable classes for repeated calls', () => {
    expect(recipeMatrixButton()).toBe(recipeMatrixButton())
    expect(recipeMatrixResponsiveCard({ tone: 'alert' })).toBe(recipeMatrixResponsiveCard({ tone: 'alert' }))
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('recipe-root')
  })

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

  it('emits the viewport media branch for recipe() responsive output', () => {
    expect(
      stylesheetHasAtRuleDeclaration(
        'media',
        `min-width: ${recipeMatrixConstants.responsiveViewportBreakpoint}px`,
        'padding-top',
        recipeMatrixConstants.responsiveViewportPadding,
      ),
    ).toBe(true)
  })

  it('emits the container-query branch for recipe() variant output', () => {
    expect(
      stylesheetHasAtRuleDeclaration(
        'container',
        `min-width: ${recipeMatrixConstants.responsiveContainerBreakpoint}px`,
        'border-top-width',
        recipeMatrixConstants.responsiveContainerBorderWidth,
      ),
    ).toBe(true)
  })
})