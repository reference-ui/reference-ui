import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'

import { cssSelectorsPlaygroundConstants } from '../src/constants'
import { cssPlaygroundClasses } from '../src/styles'

const generatedCssPath = join(process.cwd(), 'styled-system', 'styles.css')

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

beforeAll(() => {
  if (!existsSync(generatedCssPath)) {
    throw new Error(`Expected generated file at ${generatedCssPath}`)
  }

  const styledStylesheet = readFileSync(generatedCssPath, 'utf-8')

  generatedOutput.styledStylesheet = styledStylesheet
  generatedOutput.styledStylesheetAst = postcss.parse(styledStylesheet, {
    from: generatedCssPath,
  })
})

describe('plain Panda selector playground output', () => {
  it('computes runtime class tokens for the selector probes', () => {
    expect(cssPlaygroundClasses.descendantSelector).toBeTruthy()
    expect(cssPlaygroundClasses.descendantSelectorInline).toBeTruthy()
    expect(cssPlaygroundClasses.hoverSelector).toBeTruthy()
    expect(cssPlaygroundClasses.hoverSelectorInline).toBeTruthy()
    expect(cssPlaygroundClasses.topLevelConstantControl).toBeTruthy()
    expect(cssPlaygroundClasses.selfAttribute).toBeTruthy()
    expect(cssPlaygroundClasses.selfAttributeHover).toBeTruthy()
    expect(cssPlaygroundClasses.selfAttributeHoverInline).toBeTruthy()
    expect(cssPlaygroundClasses.selfAttributeQuoted).toBeTruthy()
    expect(cssPlaygroundClasses.selfAttributeState).toBeTruthy()
  })

  it('parses generated styled-system/styles.css without syntax errors', () => {
    expect(generatedOutput.styledStylesheetAst).toBeTruthy()
    expect(generatedOutput.styledStylesheetAst?.nodes.length ?? 0).toBeGreaterThan(0)
  })

  it('emits top-level literal utility declarations from the selector probes', () => {
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

  it('emits top-level imported constants', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('bd-t-w_6px')
        && (declarations.get('border-top-width') ?? []).includes(cssSelectorsPlaygroundConstants.selfAttributeHoverBorderTopWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".bd-t-w_6px",
        ".\\[\\&\\[data-component\\=card\\]\\:hover\\]\\:bd-t-w_6px[data-component=card]:hover",
      ]
    `)
  })

  it('emits imported descendant selector values', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-slot=inner]')
        && (declarations.get('margin-top') ?? []).includes(cssSelectorsPlaygroundConstants.descendantMarginTop),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".\\[\\&_\\[data-slot\\=inner\\]\\]\\:mt_12px [data-slot=inner]",
      ]
    `)
  })

  it('emits the descendant selector when the nested value is an inline literal', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-slot=inner]')
        && (declarations.get('margin-top') ?? []).includes('13px'),
    )

    expect(selectors.length).toBeGreaterThan(0)
  })

  it('emits imported hover selector values', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes(':hover')
        && (declarations.get('text-decoration') ?? []).includes(cssSelectorsPlaygroundConstants.hoverTextDecoration),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".\\[\\&\\:hover\\]\\:td_underline:hover",
      ]
    `)
  })

  it('emits the hover selector when the nested value is an inline literal', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes(':hover')
        && (declarations.get('text-decoration') ?? []).includes('line-through'),
    )

    expect(selectors.length).toBeGreaterThan(0)
  })

  it('emits imported self attribute selector values', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && !selector.includes(':hover')
        && (declarations.get('border-top-width') ?? []).includes(cssSelectorsPlaygroundConstants.selfAttributeBorderTopWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".\\[\\&\\[data-component\\=card\\]\\]\\:bd-t-w_5px[data-component=card]",
      ]
    `)
  })

  it('emits imported self attribute plus hover selector values', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && selector.includes(':hover')
        && (declarations.get('border-top-width') ?? []).includes(cssSelectorsPlaygroundConstants.selfAttributeHoverBorderTopWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".\\[\\&\\[data-component\\=card\\]\\:hover\\]\\:bd-t-w_6px[data-component=card]:hover",
      ]
    `)
  })

  it('emits a self attribute plus hover selector when the nested value is an inline literal', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && selector.includes(':hover')
        && (declarations.get('border-top-width') ?? []).includes('9px'),
    )

    expect(selectors.length).toBeGreaterThan(0)
  })

  it('emits imported quoted self attribute selector values', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component="card"]')
        && (declarations.get('border-right-width') ?? []).includes(cssSelectorsPlaygroundConstants.selfAttributeQuotedBorderRightWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".\\[\\&\\[data-component\\=\\\"card\\\"\\]\\]\\:bd-r-w_7px[data-component=\"card\"]",
      ]
    `)
  })

  it('emits imported compound self attribute selector values', () => {
    const selectors = collectRuleSelectors(
      (selector, declarations) =>
        selector.includes('[data-component=card]')
        && selector.includes('[data-state=open]')
        && (declarations.get('border-left-width') ?? []).includes(cssSelectorsPlaygroundConstants.selfAttributeStateBorderLeftWidth),
    )

    expect(selectors).toMatchInlineSnapshot(`
      [
        ".\\[\\&\\[data-component\\=card\\]\\[data-state\\=open\\]\\]\\:bd-l-w_8px[data-component=card][data-state=open]",
      ]
    `)
  })
})