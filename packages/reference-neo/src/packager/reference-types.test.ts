// Reference types leg suite: it takes a scratch outDir with a real react
// bundle and emits the S4 pins — package shape (REF-01), placeholder
// rewrite with zero residue (REF-08), primitives bundled via the alias
// (V1a), consumer externals preserved (V1b), tasty from dist (never the
// vendored decls), and entry↔decl export parity. The bundle runs for real;
// nothing here mocks the bundler.

import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { publishReactBundle } from './react.ts'
import { publishReferenceTypesBundle } from './reference-types.ts'
import { rewriteTypesRuntimeImport } from './postprocess/rewrite-types-runtime-import.ts'
import { linkGeneratedPackages } from './links.ts'
import { BASE_SYSTEM_HEADER } from './constants.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ENTRY_SOURCE = join(HERE, '..', 'entry', 'types.tsx')
const DECL_TEMPLATE = join(HERE, '..', 'entry', 'types.d.mts')
const BROWSER_TYPES = join(HERE, '..', 'reference', 'browser', 'types.ts')

let scratchRoot = ''
let outDir = ''

async function buildFixture(): Promise<void> {
  scratchRoot = mkdtempSync(join(tmpdir(), 'neo-ref-types-'))
  outDir = join(scratchRoot, '.reference-ui')
  mkdirSync(join(outDir, 'system'), { recursive: true })
  const styledDir = join(outDir, 'styled')
  mkdirSync(styledDir, { recursive: true })
  writeFileSync(
    join(styledDir, 'runtime-data.mjs'),
    'export const systemName = "probe"\nexport const runtimeData = {}\n',
    'utf-8'
  )
  await publishReactBundle({ outDir, systemName: 'probe', stylePropNames: ['color', 'margin'], recipes: {} })
  await publishReferenceTypesBundle({ outDir })
}

beforeAll(buildFixture, 120000)

afterAll(() => {
  if (scratchRoot !== '') rmSync(scratchRoot, { recursive: true, force: true })
})

function readTypesFile(name: string): string {
  return readFileSync(join(outDir, 'types', name), 'utf-8')
}

/** Exported binding names in one source file (consts, functions, interfaces, type aliases, export lists). */
function exportedNames(source: string): string[] {
  const names: string[] = []
  for (const match of source.matchAll(/export\s+(?:declare\s+)?(?:const|function|interface|type)\s+(\w+)/g)) {
    names.push(match[1] as string)
  }
  for (const match of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const entry of (match[1] as string).split(',')) {
      const name = entry.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]?.trim()
      if (name !== undefined && name !== '') names.push(name)
    }
  }
  return names
}

describe('reference-types rewrite', () => {
  it('rewrites the runtime placeholder to the literal tasty edge', () => {
    expect(rewriteTypesRuntimeImport('import("__REFERENCE_UI_TYPES_RUNTIME__")')).toBe(
      'import("./tasty/runtime.js")'
    )
  })

  it('rewrites every occurrence, not just the first', () => {
    const code = 'a("__REFERENCE_UI_TYPES_RUNTIME__") + b("__REFERENCE_UI_TYPES_RUNTIME__")'
    const rewritten = rewriteTypesRuntimeImport(code)
    expect(rewritten).not.toContain('__REFERENCE_UI_TYPES_RUNTIME__')
    expect(rewritten.match(/\.\/tasty\/runtime\.js/g)?.length).toBe(2)
  })

  it('throws when the placeholder is absent before postprocess', () => {
    expect(() => rewriteTypesRuntimeImport('const empty = true')).toThrow(
      /contain __REFERENCE_UI_TYPES_RUNTIME__ before postprocess/
    )
  })
})

describe('reference-types package (REF-01)', () => {
  it('writes the package manifest with the types exports map', () => {
    const manifest = JSON.parse(readTypesFile('package.json')) as {
      name: string
      main: string
      types: string
      exports: Record<string, unknown>
    }
    expect(manifest.name).toBe('@reference-ui/types')
    expect(manifest.main).toBe('./types.mjs')
    expect(manifest.types).toBe('./types.d.mts')
    expect(manifest.exports).toEqual({
      '.': { types: './types.d.mts', import: './types.mjs' },
      './manifest': {
        types: './tasty/manifest.d.ts',
        import: './tasty/manifest.js',
      },
      './runtime': {
        types: './tasty/runtime.d.ts',
        import: './tasty/runtime.js',
      },
    })
  })

  it('writes the bundle and the bannered declarations beside the manifest', () => {
    expect(existsSync(join(outDir, 'types', 'types.mjs'))).toBe(true)
    expect(readTypesFile('types.d.mts').startsWith(`${BASE_SYSTEM_HEADER}\n`)).toBe(true)
  })

  it('leaves the session-owned tasty dir alone', () => {
    expect(existsSync(join(outDir, 'types', 'tasty'))).toBe(false)
  })

  it('links the generated types package into the consumer scope', () => {
    linkGeneratedPackages(scratchRoot, outDir)
    const linkPath = join(scratchRoot, 'node_modules', '@reference-ui', 'types')
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
    const linked = JSON.parse(
      readFileSync(join(linkPath, 'package.json'), 'utf-8')
    ) as { name: string }
    expect(linked.name).toBe('@reference-ui/types')
  })
})

describe('reference-types bundle', () => {
  it('carries the literal runtime edge with zero placeholder residue (REF-08)', () => {
    const code = readTypesFile('types.mjs')
    expect(code).toContain('./tasty/runtime.js')
    expect(code).not.toContain('__REFERENCE_UI_TYPES_RUNTIME__')
  })

  it('bundles the per-system primitives instead of importing react (V1a)', () => {
    const code = readTypesFile('types.mjs')
    expect(code).not.toMatch(/from\s+['"]@reference-ui\/react['"]/)
    for (const displayName of ['"Div"', '"P"', '"Code"', '"H2"', '"Small"', '"Span"']) {
      expect(code).toContain(displayName)
    }
    expect(code).not.toContain('react-surface')
  })

  it('keeps react and the jsx runtime external for the consumer (V1b)', () => {
    const code = readTypesFile('types.mjs')
    expect(code).toMatch(/from\s+"react"/)
    expect(code).toContain('react/jsx-runtime')
  })

  it('bundles tasty values from dist, never the vendored decls', () => {
    const code = readTypesFile('types.mjs')
    expect(code).toContain('createTastyBrowserRuntime')
    expect(code).not.toContain('native/generated/tasty')
  })
})

describe('reference-types decl parity', () => {
  it('declares exactly the entry surface (types merged from browser/types)', () => {
    const entryNames = exportedNames(readFileSync(ENTRY_SOURCE, 'utf-8'))
    const starNames = exportedNames(readFileSync(BROWSER_TYPES, 'utf-8'))
    const declNames = exportedNames(readFileSync(DECL_TEMPLATE, 'utf-8'))
    expect([...new Set([...entryNames, ...starNames])].sort()).toEqual(
      [...new Set(declNames)].sort()
    )
  })
})
