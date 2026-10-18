// Rust tasty inlining suite for the types publish leg. It runs the transform on
// sample declarations (every supported statement form, and the forms it must
// refuse), then inlines the real entry against the installed rust package and
// proves the result: no rust or relative module specifier, an alias for each of
// the seven imported names, and a standalone typecheck with skipLibCheck off.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { inlineRustTastyTypes, transformRustTastyModule } from './reference-types-tasty.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const NEO_ROOT = join(HERE, '..', '..')
const ENTRY_SOURCE = join(NEO_ROOT, 'src', 'entry', 'types.d.mts')
const IMPORTED_NAMES = [
  'RawTastyMappedModifierKind',
  'RawTastyMemberKind',
  'RawTastyTypeOperatorKind',
  'TastyBrowserRuntime',
  'TastyMember',
  'TastySemanticKind',
  'TastySymbol',
]

const scratchRoots: string[] = []

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true })
})

function sampleNamespace(specifier: string): string {
  return `__fixture_${specifier.replace(/\W/g, '')}`
}

describe('transformRustTastyModule', () => {
  it('rewrites every supported statement form into namespace aliases', () => {
    const sample = [
      'export {};',
      "import type { A as B, C } from './x';",
      "export type { D, E as F } from './y';",
      'export declare function g(input: B): C;',
      "declare const h: import('./z').W;",
      'export interface K { value: F; }',
      '',
    ].join('\n')

    const output = transformRustTastyModule(sample, '__sample', sampleNamespace)

    expect(output.startsWith('declare namespace __sample {\n')).toBe(true)
    expect(output).toContain('import B = __fixture_x.A;')
    expect(output).toContain('import C = __fixture_x.C;')
    expect(output).toContain('export import D = __fixture_y.D;')
    expect(output).toContain('export import F = __fixture_y.E;')
    expect(output).toContain('export function g(input: B): C;')
    expect(output).toContain('const h: __fixture_z.W;')
    expect(output).toContain('export interface K { value: F; }')
    expect(output).not.toContain('export {};')
    expect(output.replace('declare namespace __sample {', '')).not.toMatch(/^declare /m)
    expect(output).not.toMatch(/export declare/)
  })

  it('refuses a default export it cannot place in a namespace', () => {
    expect(() => transformRustTastyModule('export default Thing;', '__ns', sampleNamespace)).toThrow(
      /unsupported form/,
    )
  })

  it('refuses a local export list it would have to rewrite by hand', () => {
    expect(() => transformRustTastyModule('const Local = 1;\nexport { Local };', '__ns', sampleNamespace)).toThrow(
      /unsupported form/,
    )
  })
})

describe('transformRustTastyModule, ambient augmentations', () => {
  it.each(["declare module 'x' {}", 'declare global {}'])('refuses %s, which a namespace cannot hold', (source) => {
    expect(() => transformRustTastyModule(`export {};\n${source}`, '__ns', sampleNamespace)).toThrow(
      /unsupported form/,
    )
  })
})

describe('inlineRustTastyTypes', () => {
  it('fails when the entry imports a name rust tasty does not export', () => {
    const entry = "import type { TastySymbol, NoSuchTastyName } from '@reference-ui/rust/tasty'\nexport {}\n"
    expect(() => inlineRustTastyTypes(entry)).toThrow(/no longer exports NoSuchTastyName/)
  })

  it('is deterministic across runs', () => {
    const source = readFileSync(ENTRY_SOURCE, 'utf-8')
    expect(inlineRustTastyTypes(source)).toBe(inlineRustTastyTypes(source))
  })

  const output = inlineRustTastyTypes(readFileSync(ENTRY_SOURCE, 'utf-8'))

  it('leaves no rust or relative module specifier in the published declarations', () => {
    expect(output).not.toMatch(/(?:\bfrom\s*|\bimport\s*\(\s*)['"]@reference-ui\/rust/)
    expect(output).not.toMatch(/(?:\bfrom\s*|\bimport\s*\(\s*)['"]\.\.?\//)
  })

  it('aliases each name the entry imported from the rust tasty package', () => {
    for (const name of IMPORTED_NAMES) {
      expect(output).toMatch(new RegExp(`^import ${name} = __rust_tasty_index\\.${name};$`, 'm'))
    }
  })

  it('keeps the entry declarations and their react import unchanged', () => {
    expect(output).toContain("import type * as React from 'react'")
    expect(output).toContain('export interface ReferenceComponentProps {')
  })

  it('typechecks standalone with skipLibCheck off', () => {
    expect(typecheckStandalone(output)).toBe('')
  }, 60000)

  it('catches a broken declaration in the same harness (negative control)', () => {
    const broken = `${output}\nexport declare const broken: NoSuchName;\n`
    expect(typecheckStandalone(broken)).toMatch(/error TS2304/)
  }, 60000)
})

// Typecheck one emitted declaration file the way a consumer with skipLibCheck
// off would. An empty string means clean; a spawn failure rethrows, so a missing
// compiler can never pass as a clean typecheck.
function typecheckStandalone(source: string): string {
  const scratch = mkdtempSync(join(tmpdir(), 'neo-rust-tasty-'))
  scratchRoots.push(scratch)
  mkdirSync(join(scratch, 'node_modules', '@types'), { recursive: true })
  symlinkSync(join(NEO_ROOT, 'node_modules', '@types', 'react'), join(scratch, 'node_modules', '@types', 'react'), 'dir')
  writeFileSync(join(scratch, 'types.d.mts'), source)
  writeFileSync(
    join(scratch, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        module: 'esnext',
        moduleResolution: 'bundler',
        target: 'es2022',
        lib: ['es2022', 'dom'],
        types: [],
      },
      files: ['./types.d.mts'],
    }),
  )
  const tsc = join(NEO_ROOT, 'node_modules', '.bin', 'tsc')
  try {
    execFileSync(tsc, ['-p', join(scratch, 'tsconfig.json'), '--pretty', 'false'], { encoding: 'utf-8', stdio: 'pipe' })
    return ''
  } catch (error) {
    const failure = error as { status?: unknown; stdout?: unknown }
    if (typeof failure.status !== 'number') throw error
    return String(failure.stdout ?? '')
  }
}
