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
  reactBarrel: '',
  reactManifest: null as null | Record<string, unknown>,
  reactStylesheet: '',
  reactStylesheetAst: null as Root | null,
  systemBarrel: '',
  systemManifest: null as null | Record<string, unknown>,
}

beforeAll(async () => {
  const [reactManifestContent, systemManifestContent, reactBarrel, reactStylesheet, systemBarrel] = await Promise.all([
    waitForGeneratedFile(join('react', 'package.json')),
    waitForGeneratedFile(join('system', 'package.json')),
    waitForGeneratedFile(join('react', 'react.d.mts')),
    waitForGeneratedFile(join('react', 'styles.css')),
    waitForGeneratedFile(join('system', 'system.d.mts')),
  ])

  generatedOutput.reactManifest = JSON.parse(reactManifestContent) as Record<string, unknown>
  generatedOutput.systemManifest = JSON.parse(systemManifestContent) as Record<string, unknown>
  generatedOutput.reactBarrel = reactBarrel
  generatedOutput.reactStylesheet = reactStylesheet
  generatedOutput.reactStylesheetAst = postcss.parse(reactStylesheet, {
    from: join(refUiDir, 'react', 'styles.css'),
  })
  generatedOutput.systemBarrel = systemBarrel
})

describe('distro – generated package metadata', () => {
  it('react package advertises react.d.mts as its types entry', () => {
    expect(generatedOutput.reactManifest?.types).toBe('./react.d.mts')
  })

  it('system package advertises system.d.mts as its types entry', () => {
    expect(generatedOutput.systemManifest?.types).toBe('./system.d.mts')
  })

  it('react package exports styles.css as a public subpath', () => {
    expect(generatedOutput.reactManifest?.exports).toMatchObject({
      './styles.css': './styles.css',
    })
  })

  it('system package exports baseSystem as a public subpath', () => {
    expect(generatedOutput.systemManifest?.exports).toMatchObject({
      './baseSystem': {
        import: './baseSystem.mjs',
        types: './baseSystem.d.mts',
      },
    })
  })
})

describe('distro – generated declaration barrels', () => {
  it('react declaration barrel re-exports the generated entry module', () => {
    expect(generatedOutput.reactBarrel).toBe("export * from './entry/react'\n")
  })

  it('system declaration barrel re-exports the generated entry module', () => {
    expect(generatedOutput.systemBarrel).toBe("export * from './entry/system'\n")
  })
})

describe('distro – generated stylesheet output', () => {
  it('react stylesheet parses as CSS without syntax errors', () => {
    expect(generatedOutput.reactStylesheetAst).toBeTruthy()
    expect(generatedOutput.reactStylesheetAst?.nodes.length ?? 0).toBeGreaterThan(0)
  })

  it('react stylesheet standard declarations do not contain empty properties or values', () => {
    const invalidDeclarations: string[] = []
    let declarationCount = 0

    generatedOutput.reactStylesheetAst?.walkDecls((decl) => {
      declarationCount += 1

      const isCustomProperty = decl.prop.startsWith('--')

      if (decl.prop.trim().length === 0) {
        invalidDeclarations.push(`${decl.prop}:${decl.value}`)
        return
      }

      if (!isCustomProperty && decl.value.trim().length === 0) {
        invalidDeclarations.push(`${decl.prop}:${decl.value}`)
      }
    })

    expect(declarationCount).toBeGreaterThan(0)
    expect(invalidDeclarations).toEqual([])
  })

  it('react stylesheet does not contain suspicious placeholder fragments', () => {
    const foundFragments = suspiciousStylesheetFragments.filter((fragment) =>
      generatedOutput.reactStylesheet.includes(fragment),
    )

    expect(generatedOutput.reactStylesheet.length).toBeGreaterThan(0)
    expect(foundFragments).toEqual([])
  })
})
