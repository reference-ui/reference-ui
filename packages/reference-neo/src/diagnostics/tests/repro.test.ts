// Error-code repro suite: one test case per diagnostic code through the
// whole compiler. It takes a minimal world per row and emits the engine's
// real diagnostics with no stubs between the fixture and native compile.
// Each row pins its code with its severity; add a row when you mint a code,
// and the suite fails loudly if the fixture ever stops reproducing it.
import { join } from 'node:path'
import { analyzeDetailed as analyzeAtlasDetailed } from '@reference-ui/rust/atlas'
import { traceDetailed } from '@reference-ui/rust/styletrace'
import { buildTasty } from '@reference-ui/rust/tasty/build'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { emitDtsDetailed } from '@reference-ui/rust/typegen'
import { describe, expect, it } from 'vitest'
import { COMPILER_ROWS } from './repro-rows-compiler.ts'
import { DEFAULT_ROWS } from './repro-rows-default.ts'
import {
  TOKENS_FILE,
  compileWorld,
  configFile,
  useReproCleanup,
  writeProject,
  type ReproRow,
} from './repro-world.ts'

useReproCleanup()

async function expectRow(row: ReproRow): Promise<void> {
  const dir = await writeProject({
    'ui.config.ts': configFile(row.configExtra),
    'theme/tokens.ts': TOKENS_FILE,
    ...row.files,
  })
  const result = await compileWorld(dir)
  const entries =
    row.channel === 'compilerDiagnostics' ? (result.compilerDiagnostics ?? []) : result.diagnostics
  const found = entries.filter(entry => entry.code === row.code)
  expect(found.length).toBeGreaterThan(0)
  for (const entry of found) {
    expect(entry.severity).toBe(row.severity)
    expect(entry.message.trim().length).toBeGreaterThan(0)
  }
}

describe('diagnostic code repro', () => {
  for (const row of [...DEFAULT_ROWS, ...COMPILER_ROWS]) {
    it(`${row.code} reproduces through the compiler as ${row.severity}`, () => expectRow(row))
  }
})

interface TastyReproRow {
  code: string
  files: Record<string, string>
}

// One row per tasty warning code: the minimal workspace that reproduces it
// through the whole tasty compiler. buildTasty drives the native scan plus
// the JS build exactly as the reference bridge drives it, so a red row means
// the engine stopped emitting the code it promises in the registry.
const TASTY_REPRO_ROWS: TastyReproRow[] = [
  {
    code: 'TST-W-PARSE-ERROR',
    files: { 'src/broken.ts': 'export interface Broken {\n' },
  },
  {
    code: 'TST-W-DUPLICATE-DECLARATION',
    files: { 'src/dup.ts': 'export type Dup = string;\nexport type Dup = number;\n' },
  },
  {
    code: 'TST-W-DUPLICATE-MEMBER',
    files: {
      'src/widgets.ts':
        'export interface Widget {\n  alpha: string\n}\n\nexport interface Widget {\n  alpha: number\n}\n',
    },
  },
  {
    code: 'TST-W-STAR-AMBIGUITY',
    files: {
      'src/a.ts': 'export interface Widget {\n  a: string\n}\n',
      'src/b.ts': 'export interface Widget {\n  b: number\n}\n',
      'src/barrel.ts': "export * from './a'\nexport * from './b'\n",
    },
  },
  {
    code: 'TST-W-DUPLICATE-SYMBOL-NAME',
    files: {
      'src/alpha.ts': 'export interface Shared {\n  alpha: string\n}\n',
      'src/beta.ts': 'export interface Shared {\n  beta: number\n}\n',
    },
  },
]

describe('tasty diagnostic code repro', () => {
  for (const row of TASTY_REPRO_ROWS) {
    it(`${row.code} reproduces through the compiler as warning`, async () => {
      const dir = await writeProject(row.files)
      const built = await buildTasty({
        rootDir: dir,
        include: ['src/**/*.ts'],
        outputDir: join(dir, 'tasty-out'),
      })
      const found = built.diagnostics.filter(entry => entry.code === row.code)
      expect(found.length).toBeGreaterThan(0)
      for (const entry of found) {
        expect(entry.level).toBe('warning')
        expect(entry.message.trim().length).toBeGreaterThan(0)
      }
    })
  }

  it('TST-E-SCAN-FAILED reproduces as a coded throw on an invalid glob', async () => {
    const dir = await writeProject({ 'src/ok.ts': 'export interface Ok {\n  a: string\n}\n' })
    await expect(
      buildTasty({ rootDir: dir, include: ['['], outputDir: join(dir, 'tasty-out') })
    ).rejects.toThrow('TST-E-SCAN-FAILED')
  })
})

interface AtlasReproRow {
  code: string
  severity: 'warning' | 'error'
  files: Record<string, string>
  config?: { include?: string[]; exclude?: string[] }
}

// One row per atlas code: the minimal app that reproduces it through the
// whole analyzer. analyzeDetailed drives the native scan plus resolution
// exactly as embedders drive it, so a red row means the engine stopped
// emitting the code it promises in the registry.
const ATLAS_REPRO_ROWS: AtlasReproRow[] = [
  {
    code: 'ATL-W-UNRESOLVED-PROPS-TYPE',
    severity: 'warning',
    files: {
      'src/components/BrokenCard.tsx':
        "import * as React from 'react'\nimport type { MissingProps } from '../types/missing'\n\nexport function BrokenCard(props: MissingProps): React.ReactElement {\n  return <section>{JSON.stringify(props)}</section>\n}\n",
    },
  },
  {
    code: 'ATL-W-UNSUPPORTED-PROPS-ANNOTATION',
    severity: 'warning',
    files: {
      'src/components/InlineBadge.tsx':
        "import * as React from 'react'\n\nexport function InlineBadge(props: {\n  label: string\n}): React.ReactElement {\n  return <span>{props.label}</span>\n}\n",
    },
  },
  {
    code: 'ATL-W-UNRESOLVED-INCLUDE-PACKAGE',
    severity: 'warning',
    files: {
      'src/components/Ok.tsx':
        "import * as React from 'react'\n\nexport function Ok(): React.ReactElement {\n  return <span />\n}\n",
    },
    config: { include: ['@fixtures/missing-ui'] },
  },
  {
    code: 'ATL-E-SCAN-FAILED',
    severity: 'error',
    files: {
      'src/components/Ok.tsx':
        "import * as React from 'react'\n\nexport function Ok(): React.ReactElement {\n  return <span />\n}\n",
    },
    config: { exclude: ['['] },
  },
]

describe('atlas diagnostic code repro', () => {
  for (const row of ATLAS_REPRO_ROWS) {
    it(`${row.code} reproduces through the compiler as ${row.severity}`, async () => {
      const dir = await writeProject(row.files)
      const result = await analyzeAtlasDetailed(
        dir,
        row.config === undefined ? undefined : { rootDir: dir, ...row.config }
      )
      const found = result.diagnostics.filter(entry => entry.code === row.code)
      expect(found.length).toBeGreaterThan(0)
      for (const entry of found) {
        expect(entry.severity).toBe(row.severity)
        expect(entry.message.trim().length).toBeGreaterThan(0)
      }
    })
  }
})

// Minimal declaration root: the synced react/styled surface the trace builds
// its StyleProps and primitive sets from. Mirrors the styletrace TS-seam
// synced fixture, so the warning row traces AppCard while skipping its
// unparsable sibling, and the error rows fail only on the side they name.
const STYLETRACE_DECL_FILES: Record<string, string> = {
  'decl/.reference-ui/react/package.json': `{\n  "name": "@reference-ui/react",\n  "types": "./react.d.mts"\n}\n`,
  'decl/.reference-ui/react/react.d.mts': `export * from './entry/react'\n`,
  'decl/.reference-ui/react/entry/react.d.mts': `export { Div, type StyleProps } from '../types/index.d.mts'\n`,
  'decl/.reference-ui/react/types/index.d.mts': `export { Div } from '../system/primitives/index.d.mts'\nexport type { StyleProps } from './style-props.d.mts'\n`,
  'decl/.reference-ui/react/types/style-props.d.mts': `export type StyleProps = {\n  color?: string\n}\n`,
  'decl/.reference-ui/react/system/primitives/index.d.mts': `declare const Div: (props: unknown) => unknown\nexport { Div }\n`,
  'decl/.reference-ui/styled/package.json': `{\n  "name": "@reference-ui/styled",\n  "types": "./types/index.d.ts"\n}\n`,
  'decl/.reference-ui/styled/types/index.d.ts': `export type {} from './system-types'\n`,
  'decl/.reference-ui/styled/types/system-types.d.ts': `export interface CssVarProperties {}\nexport type CssVarKeys = never\n`,
}

const STYLETRACE_APPCARD = `import { Div } from '@reference-ui/react'\n\nexport interface AppCardProps {\n  color?: string\n  title?: string\n}\n\nexport function AppCard({ title, ...styleProps }: AppCardProps) {\n  return <Div {...styleProps}>{title}</Div>\n}\n`

const STYLETRACE_BROKEN = 'export function Broken( {\n'

// One row per styletrace warning code: the minimal source plus declaration
// roots that reproduce it through the whole tracer. traceDetailed drives the
// native trace exactly as embedders drive it, so a red row means the engine
// stopped emitting the code it promises in the registry.
const STYLETRACE_WARNING_ROWS: { code: string; src: Record<string, string> }[] = [
  {
    code: 'STT-W-SKIPPED-FILE',
    src: { 'src/index.tsx': STYLETRACE_APPCARD, 'src/broken.tsx': STYLETRACE_BROKEN },
  },
]

describe('styletrace diagnostic code repro', () => {
  for (const row of STYLETRACE_WARNING_ROWS) {
    it(`${row.code} reproduces through the compiler as warning`, async () => {
      const dir = await writeProject({ ...STYLETRACE_DECL_FILES, ...row.src })
      const result = await traceDetailed(join(dir, 'src'), join(dir, 'decl'))
      const found = result.diagnostics.filter(entry => entry.code === row.code)
      expect(found.length).toBeGreaterThan(0)
      for (const entry of found) {
        expect(entry.severity).toBe('warning')
        expect(entry.message.trim().length).toBeGreaterThan(0)
        expect(entry.file ?? '').toMatch(/broken\.tsx$/)
      }
      expect(result.bindings.map(binding => binding.name)).toContain('AppCard')
    })
  }

  it('STT-E-SCAN-FAILED reproduces as a coded throw on an unreadable source root', async () => {
    const dir = await writeProject(STYLETRACE_DECL_FILES)
    await expect(
      traceDetailed(join(dir, 'nonexistent-src'), join(dir, 'decl'))
    ).rejects.toThrow('STT-E-SCAN-FAILED')
  })

  it('STT-E-UNRESOLVED-SURFACE reproduces as a coded throw on a declaration root without entrypoints', async () => {
    const dir = await writeProject({
      ...STYLETRACE_DECL_FILES,
      'src/index.tsx': STYLETRACE_APPCARD,
    })
    await expect(
      traceDetailed(join(dir, 'src'), join(dir, 'empty-decl'))
    ).rejects.toThrow('STT-E-UNRESOLVED-SURFACE')
  })
})

interface TypegenReproRow {
  code: string
  spec: EvaluatedSystemSpec
  strict?: string[]
}

function typegenSpec(overrides: Partial<EvaluatedSystemSpec> = {}): EvaluatedSystemSpec {
  return {
    schemaVersion: 1,
    profile: 'reference-ui',
    name: 'tgn-repro',
    tokens: {},
    fonts: {},
    globalCss: [],
    keyframes: {},
    recipes: {},
    staticCss: {},
    provenance: [],
    ...overrides,
  }
}

// One row per typegen warning code: the minimal spec that reproduces it
// through the whole printer. emitDtsDetailed drives the native lowering plus
// the same printers the packager's sync emit runs, so a red row means the
// engine stopped emitting the code it promises in the registry.
const TYPEGEN_REPRO_ROWS: TypegenReproRow[] = [
  {
    code: 'TGN-W-UNKNOWN-TOKEN-CATEGORY',
    spec: typegenSpec({
      tokens: { animations: { spin: { value: 'spin 1s linear infinite' } } },
    }),
  },
  {
    code: 'TGN-W-INVALID-RECIPE-NAME',
    spec: typegenSpec({
      recipes: { '123': { variants: { size: { sm: { p: '1r' } } } } },
    }),
  },
  {
    code: 'TGN-W-EMPTY-RECIPE',
    spec: typegenSpec({ recipes: { card: { variants: {} } } }),
  },
  {
    code: 'TGN-W-INVALID-COMPOUND-VARIANT',
    spec: typegenSpec({
      recipes: {
        button: {
          variants: { tone: { quiet: { bg: 'n100' }, loud: { bg: 'n300' } } },
          compoundVariants: [{ tone: 'nope', css: { border: '1px' } }],
        },
      },
    }),
  },
  {
    code: 'TGN-W-UNKNOWN-STRICT-CATEGORY',
    spec: typegenSpec({
      tokens: { colors: { n100: { value: '#fff' } } },
      breakpoints: { sm: '640px' },
    }),
    strict: ['fonts'],
  },
  {
    code: 'TGN-W-ABSENT-STRICT-CATEGORY',
    spec: typegenSpec({
      tokens: { colors: { n100: { value: '#fff' } } },
      breakpoints: { sm: '640px' },
    }),
    strict: ['spacing'],
  },
  {
    code: 'TGN-W-EMPTY-FONT-FAMILY',
    spec: typegenSpec({
      fonts: { display: { value: 'Fancy', weights: {} } },
    }),
  },
]

describe('typegen diagnostic code repro', () => {
  for (const row of TYPEGEN_REPRO_ROWS) {
    it(`${row.code} reproduces through the compiler as warning`, () => {
      const result = emitDtsDetailed({ baseSystem: row.spec, strict: row.strict })
      const found = result.diagnostics.filter(entry => entry.code === row.code)
      expect(found.length).toBeGreaterThan(0)
      for (const entry of found) {
        expect(entry.severity).toBe('warning')
        expect(entry.message.trim().length).toBeGreaterThan(0)
      }
    })
  }

  it('TGN-E-INVALID-BASE-SYSTEM reproduces as a coded throw on a bad schema version', () => {
    const spec = typegenSpec({ schemaVersion: 999 as unknown as 1 })
    expect(() => emitDtsDetailed({ baseSystem: spec })).toThrow('TGN-E-INVALID-BASE-SYSTEM')
  })
})
