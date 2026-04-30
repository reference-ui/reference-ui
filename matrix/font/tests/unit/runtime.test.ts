import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss, { type Root } from 'postcss'
import type {
  FontName,
  FontProps,
  FontRegistry,
  FontWeightName,
} from '@reference-ui/react'

import { fontMatrixConstants } from '../../src/font/styles'
import { Index, matrixFontMarker } from '../../src/index'

type StringKey<T> = Extract<keyof T, string>

const refUiDir = join(process.cwd(), '.reference-ui')
const suspiciousStylesheetFragments = ['[object Object]', 'undefined', 'NaN', '\u0000', '\uFFFD'] as const

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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

function parseReactStylesheet(source: string): Root {
  return postcss.parse(source, {
    from: join(refUiDir, 'react', 'styles.css'),
  })
}

function collectFontFaceRules(reactStylesheetAst: Root | null): Array<Record<string, string>> {
  const fontFaceRules: Array<Record<string, string>> = []

  reactStylesheetAst?.walkAtRules('font-face', (rule) => {
    const declarations: Record<string, string> = {}

    rule.walkDecls((decl) => {
      declarations[decl.prop] = decl.value
    })

    fontFaceRules.push(declarations)
  })

  return fontFaceRules
}

const generatedOutput = {
  reactFontRegistryTypes: '',
  reactGeneratedTypes: '',
  reactStylesheet: '',
  reactStylesheetAst: null as Root | null,
  systemGeneratedTypes: '',
}

beforeAll(async () => {
  const [reactStylesheet, reactFontRegistryTypes, reactGeneratedTypes, systemGeneratedTypes] = await Promise.all([
    waitForGeneratedFile(join('react', 'styles.css')),
    waitForGeneratedFile(join('react', 'types', 'fontRegistry.d.ts')),
    waitForGeneratedFile(join('react', 'types.generated.d.mts')),
    waitForGeneratedFile(join('system', 'types.generated.d.mts')),
  ])

  generatedOutput.reactStylesheet = reactStylesheet
  generatedOutput.reactFontRegistryTypes = reactFontRegistryTypes
  generatedOutput.reactGeneratedTypes = reactGeneratedTypes
  generatedOutput.systemGeneratedTypes = systemGeneratedTypes
  generatedOutput.reactStylesheetAst = parseReactStylesheet(reactStylesheet)
})

describe('font matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixFontMarker).toBe('reference-ui-matrix-font')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('font-root')
  })
})

describe('font matrix generated stylesheet', () => {
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

  it('emits font-face rules, font utilities, and font-level CSS contributions', () => {
    const fontFaceCount = generatedOutput.reactStylesheet.match(/@font-face/g)?.length ?? 0

    expect(fontFaceCount).toBeGreaterThanOrEqual(3)
    expect(generatedOutput.reactStylesheet).toMatch(
      new RegExp(`font-family:\\s*["']?${escapeForRegExp(fontMatrixConstants.sansFamily)}["']?`),
    )
    expect(generatedOutput.reactStylesheet).toMatch(
      new RegExp(`font-family:\\s*["']?${escapeForRegExp(fontMatrixConstants.serifFamily)}["']?`),
    )
    expect(generatedOutput.reactStylesheet).toMatch(
      new RegExp(`font-family:\\s*["']?${escapeForRegExp(fontMatrixConstants.monoFamily)}["']?`),
    )
    expect(generatedOutput.reactStylesheet).toMatch(
      new RegExp(`size-adjust:\\s*${escapeForRegExp(fontMatrixConstants.serifSizeAdjust)}`),
    )
    expect(generatedOutput.reactStylesheet).toMatch(
      new RegExp(
        `descent-override:\\s*${escapeForRegExp(fontMatrixConstants.serifDescentOverride)}`,
      ),
    )
  })

  it('emits one @font-face rule per authored entry in a fontFace array', () => {
    const sansFontFaceRules = collectFontFaceRules(generatedOutput.reactStylesheetAst).filter((rule) =>
      (rule['font-family'] ?? '').includes(fontMatrixConstants.sansFamily),
    )
    const normalSansRule = sansFontFaceRules.find(
      (rule) => rule.src === 'url(/fonts/inter.woff2) format("woff2")',
    )
    const italicSansRule = sansFontFaceRules.find(
      (rule) => rule.src === 'url(/fonts/inter-italic.woff2) format("woff2")',
    )

    expect(normalSansRule).toMatchObject({ 'font-style': 'normal' })
    expect(italicSansRule).toMatchObject({ 'font-style': 'italic' })
  })
})

describe('generated @reference-ui/react font types', () => {
  it('FontProps', () => {
    expectTypeOf<FontProps>().not.toEqualTypeOf<never>()
  })

  it('FontRegistry', () => {
    expectTypeOf<FontRegistry>().not.toEqualTypeOf<never>()
  })

  it('FontName', () => {
    expectTypeOf<FontName>().toEqualTypeOf<StringKey<FontRegistry>>()
  })

  it('FontWeightName<FontName>', () => {
    expectTypeOf<FontWeightName<FontName>>().toEqualTypeOf<
      StringKey<FontRegistry[FontName]>
    >()
  })

  it('emits generated font registry declarations for the authored fonts', () => {
    expect(generatedOutput.reactFontRegistryTypes).toContain('interface FontRegistry {')
    expect(generatedOutput.reactGeneratedTypes).toContain('interface FontRegistry {')
    expect(generatedOutput.systemGeneratedTypes).toContain('interface FontRegistry {')
    expect(generatedOutput.reactGeneratedTypes).toContain('"sans": {')
    expect(generatedOutput.reactGeneratedTypes).toContain('"serif": {')
    expect(generatedOutput.reactGeneratedTypes).toContain('"mono": {')
    expect(generatedOutput.reactGeneratedTypes).toContain('"bold": true')
    expect(generatedOutput.reactGeneratedTypes).toContain('"black": true')
  })
})