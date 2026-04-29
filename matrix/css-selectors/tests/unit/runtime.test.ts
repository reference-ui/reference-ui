import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

import { cssSelectorsMatrixConstants } from '../../src/constants'
import { cssSelectorsMatrixClasses } from '../../src/styles'

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

beforeAll(async () => {
  const styledStylesheet = await waitForGeneratedFile(join('styled', 'styles.css'))

  generatedOutput.styledStylesheet = styledStylesheet
  generatedOutput.styledStylesheetAst = postcss.parse(styledStylesheet, {
    from: join(refUiDir, 'styled', 'styles.css'),
  })
})

describe('css selectors matrix emitted output', () => {
  it('computes runtime class tokens for the selector probes', () => {
    expect(cssSelectorsMatrixClasses.descendantSelector).toBeTruthy()
    expect(cssSelectorsMatrixClasses.hoverSelector).toBeTruthy()
    expect(cssSelectorsMatrixClasses.selfAttribute).toBeTruthy()
    expect(cssSelectorsMatrixClasses.selfAttributeHover).toBeTruthy()
    expect(cssSelectorsMatrixClasses.selfAttributeQuoted).toBeTruthy()
    expect(cssSelectorsMatrixClasses.selfAttributeState).toBeTruthy()
  })

  it('parses generated styled/styles.css without syntax errors', () => {
    expect(generatedOutput.styledStylesheetAst).toBeTruthy()
    expect(generatedOutput.styledStylesheetAst?.nodes.length ?? 0).toBeGreaterThan(0)
  })

  it('emits top-level utility declarations from the selector probes', () => {
    const textDecorationSelectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('.td_none')
        && (declarations.get('text-decoration') ?? []).includes('none'),
    )
    const borderStyleSelectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('.border-style_solid')
        && (declarations.get('border-style') ?? []).includes('solid'),
    )

    expect(textDecorationSelectors.length).toBeGreaterThan(0)
    expect(borderStyleSelectors.length).toBeGreaterThan(0)
  })

  it('tracks whether the descendant selector control branch emits', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-slot=inner]')
        && (declarations.get('margin-top') ?? []).includes(cssSelectorsMatrixConstants.descendantMarginTop),
    )

    expect(selectors).toMatchInlineSnapshot(`[]`)
  })

  it('tracks whether the plain hover selector control branch emits', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes(':hover')
        && (declarations.get('text-decoration') ?? []).includes(cssSelectorsMatrixConstants.hoverTextDecoration),
    )

    expect(selectors).toMatchInlineSnapshot(`[]`)
  })

  it('tracks whether a self attribute selector emits', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && !selector.includes(':hover')
        && (declarations.get('border-top-width') ?? []).includes(cssSelectorsMatrixConstants.selfAttributeBorderTopWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`[]`)
  })

  it('tracks whether a self attribute plus hover selector emits', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && selector.includes(':hover')
        && (declarations.get('border-top-width') ?? []).includes(cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`[]`)
  })

  it('tracks whether a quoted self attribute selector emits', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component="card"]')
        && (declarations.get('border-right-width') ?? []).includes(cssSelectorsMatrixConstants.selfAttributeQuotedBorderRightWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`[]`)
  })

  it('tracks whether a compound self attribute selector emits', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && selector.includes('[data-state=open]')
        && (declarations.get('border-left-width') ?? []).includes(cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`[]`)
  })
})