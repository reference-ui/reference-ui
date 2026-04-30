import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

import { cssSelectorsMatrixConstants } from '../../src/constants'
import { cssSelectorsMatrixClasses, selectorRecipe } from '../../src/styles'

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
  styledStylesheet: '',
  styledStylesheetAst: null as Root | null,
}

interface SelectorAssertion {
  declaration: string
  expectedValue: string
  requiredFragments: readonly string[]
}

function collectRuleSelectors(
  matcher: (selector: string, declarations: ReadonlyMap<string, readonly string[]>) => boolean,
): string[] {
  const selectors = new Set<string>()

  generatedOutput.styledStylesheetAst?.walkRules((rule) => {
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

function expectSelectorsToExist(assertion: SelectorAssertion): void {
  const selectors = collectRuleSelectors(
    (selector, declarations) =>
      assertion.requiredFragments.every(fragment => selector.includes(fragment))
      && (declarations.get(assertion.declaration) ?? []).includes(assertion.expectedValue),
  )

  expect(selectors, `${assertion.declaration}:${assertion.expectedValue}`).toHaveLength(1)
}

beforeAll(async () => {
  const styledStylesheet = await waitForGeneratedFile(join('styled', 'styles.css'))

  generatedOutput.styledStylesheet = styledStylesheet
  generatedOutput.styledStylesheetAst = postcss.parse(styledStylesheet, {
    from: join(refUiDir, 'styled', 'styles.css'),
  })
})

describe('css selectors matrix emitted output', () => {
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

  it('emits top-level declarations that resolve imported constants', () => {
    expectSelectorsToExist({
      declaration: 'border-style',
      expectedValue: cssSelectorsMatrixConstants.topLevelBorderStyle,
      requiredFragments: ['border-style_solid'],
    })
    expectSelectorsToExist({
      declaration: 'border-top-width',
      expectedValue: cssSelectorsMatrixConstants.topLevelBorderTopWidth,
      requiredFragments: ['bd-t-w_4px'],
    })
  })

  it('emits exhaustive css() selector branches backed by constants.ts', () => {
    for (const assertion of [
      {
        declaration: 'margin-top',
        expectedValue: cssSelectorsMatrixConstants.descendantMarginTop,
        requiredFragments: ['[data-slot=inner]'],
      },
      {
        declaration: 'padding-left',
        expectedValue: cssSelectorsMatrixConstants.directChildPaddingLeft,
        requiredFragments: ['[data-slot=child]', '>'],
      },
      {
        declaration: 'margin-left',
        expectedValue: cssSelectorsMatrixConstants.adjacentSiblingMarginLeft,
        requiredFragments: ['[data-slot=peer]', '+'],
      },
      {
        declaration: 'padding-top',
        expectedValue: cssSelectorsMatrixConstants.generalSiblingPaddingTop,
        requiredFragments: ['[data-slot=overlay]', '~'],
      },
      {
        declaration: 'text-decoration',
        expectedValue: cssSelectorsMatrixConstants.hoverTextDecoration,
        requiredFragments: [':hover'],
      },
      {
        declaration: 'outline-width',
        expectedValue: cssSelectorsMatrixConstants.focusVisibleOutlineWidth,
        requiredFragments: [':focus-visible'],
      },
      {
        declaration: 'border-top-width',
        expectedValue: cssSelectorsMatrixConstants.selfAttributeBorderTopWidth,
        requiredFragments: ['[data-component=card]'],
      },
      {
        declaration: 'border-top-width',
        expectedValue: cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth,
        requiredFragments: ['[data-component=card]', ':hover'],
      },
      {
        declaration: 'border-right-width',
        expectedValue: cssSelectorsMatrixConstants.selfAttributeQuotedBorderRightWidth,
        requiredFragments: ['[data-component="card"]'],
      },
      {
        declaration: 'border-left-width',
        expectedValue: cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth,
        requiredFragments: ['[data-component=card]', '[data-state=open]'],
      },
    ] satisfies SelectorAssertion[]) {
      expectSelectorsToExist(assertion)
    }
  })

  it('emits recipe() selector branches backed by constants.ts', () => {
    for (const assertion of [
      {
        declaration: 'border-style',
        expectedValue: cssSelectorsMatrixConstants.recipeBaseBorderStyle,
        requiredFragments: ['border-style_dashed'],
      },
      {
        declaration: 'border-top-width',
        expectedValue: cssSelectorsMatrixConstants.recipeBaseBorderTopWidth,
        requiredFragments: ['bd-t-w_9px'],
      },
      {
        declaration: 'margin-top',
        expectedValue: cssSelectorsMatrixConstants.recipeDescendantMarginTop,
        requiredFragments: ['[data-slot=recipe-inner]'],
      },
      {
        declaration: 'padding-left',
        expectedValue: cssSelectorsMatrixConstants.recipeDirectChildPaddingLeft,
        requiredFragments: ['[data-slot=recipe-child]', '>'],
      },
      {
        declaration: 'text-decoration',
        expectedValue: cssSelectorsMatrixConstants.recipeHoverTextDecoration,
        requiredFragments: [':hover'],
      },
      {
        declaration: 'border-right-width',
        expectedValue: cssSelectorsMatrixConstants.recipeQuotedBorderRightWidth,
        requiredFragments: ['[data-component="recipe-card"]'],
      },
      {
        declaration: 'border-left-width',
        expectedValue: cssSelectorsMatrixConstants.recipeStateBorderLeftWidth,
        requiredFragments: ['[data-component=recipe-card]', '[data-state=open]'],
      },
      {
        declaration: 'border-top-width',
        expectedValue: cssSelectorsMatrixConstants.recipeCompoundBorderTopWidth,
        requiredFragments: ['[data-component=recipe-card]'],
      },
    ] satisfies SelectorAssertion[]) {
      expectSelectorsToExist(assertion)
    }
  })
})