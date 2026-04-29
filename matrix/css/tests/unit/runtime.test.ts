import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

import { cssMatrixConstants } from '../../src/constants'
import { matrixCssMarker, Index } from '../../src/index'
import { cssMatrixClasses } from '../../src/styles'

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

function collectRuleSelectors(
  matcher: (selector: string, declarations: ReadonlyMap<string, readonly string[]>) => boolean,
): string[] {
  const selectors = new Set<string>()

  generatedOutput.reactStylesheetAst?.walkRules((rule) => {
    const declarations = new Map<string, string[]>()

    rule.walkDecls((decl: { prop: string; value: string }) => {
      const values = declarations.get(decl.prop) ?? []
      values.push(decl.value)
      declarations.set(decl.prop, values)
    })

    if (matcher(rule.selector, declarations)) {
      selectors.add(rule.selector)
    }
  })

  return [...selectors]
}

beforeAll(async () => {
  const reactStylesheet = await waitForGeneratedFile(join('react', 'styles.css'))

  generatedOutput.reactStylesheet = reactStylesheet
  generatedOutput.reactStylesheetAst = postcss.parse(reactStylesheet, {
    from: join(refUiDir, 'react', 'styles.css'),
  })
})

describe('css matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixCssMarker).toBe('reference-ui-matrix-css')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('css-root')
  })

  it('defines the card css class', () => {
    expect(cssMatrixClasses.card).toBeTruthy()
  })

  it('defines the positioned css class', () => {
    expect(cssMatrixClasses.positioned).toBeTruthy()
  })

  it('defines the component hoverable css class', () => {
    expect(cssMatrixClasses.componentHoverable).toBeTruthy()
  })

  it('computes a runtime class token for the [data-component=card]:hover branch', () => {
    const classTokens = cssMatrixClasses.componentHoverable.split(/\s+/)

    expect(classTokens.some((token) => token.includes('[data-component=card]:hover'))).toBe(true)
  })

  it('defines the hoverable css class', () => {
    expect(cssMatrixClasses.hoverable).toBeTruthy()
  })

  it('defines the nested css class', () => {
    expect(cssMatrixClasses.nestedParent).toBeTruthy()
  })

  it('defines the stateful css class', () => {
    expect(cssMatrixClasses.stateful).toBeTruthy()
  })

  it('defines the container css class', () => {
    expect(cssMatrixClasses.containerProbe).toBeTruthy()
  })

  it('exports the configured css layer name', () => {
    expect(cssMatrixConstants.layerName).toBe('css')
  })

  it('exports the configured css layer name again for direct constants access', () => {
    expect(cssMatrixConstants.layerName).toBe('css')
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

  it('emits the nested descendant selector branch into generated react/styles.css', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-slot=inner]') && (declarations.get('margin-top') ?? []).includes('12px'),
    )

    expect(selectors.length).toBeGreaterThan(0)
  })

  it('does not emit the [data-component=card]:hover selector branch into generated react/styles.css yet', () => {
    const selectors = collectRuleSelectors((selector) => selector.includes('[data-component=card]'))
    const activeBorderSelectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]') &&
        (declarations.get('border-top-width') ?? []).includes(
          cssMatrixConstants.componentHoverActiveBorderTopWidth,
        ),
    )

    expect(selectors).toEqual([])
    expect(activeBorderSelectors).toEqual([])
  })
})