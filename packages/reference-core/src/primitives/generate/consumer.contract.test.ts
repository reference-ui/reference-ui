// Producer-to-consumer contract for the generated declarations.
// Every fixtures/*.golden.txt and the typegen styled types for a sample system are staged where their real consumer resolves them, with every exported type probed as style props.
// The real compileNative runs in a child process, so a tracer crash (SIGSEGV) fails the case instead of killing the worker, and the child must exit clean, under budget, with a traced host per live probe.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { ELEMENT_JSX_NAMES } from '../../native/element-vocabulary.ts'
import { buildCompileRequest } from '../../native/request.ts'
import { BASE_SYSTEM_HEADER } from '../../packager/constants.ts'

const FIXTURES = fileURLToPath(new URL('./fixtures', import.meta.url))
const COMPILE_MODULE = new URL('../../native/compile.ts', import.meta.url).href
const REACT_GOLDEN = 'react-types-none-plain.golden.txt'
const REACT_ENTRY = '@reference-ui/react'
const STYLED_ENTRY = '@reference-ui/styled'
const PACKAGE_JSON = '{"name":"consumer-contract","private":true,"type":"module"}\n'
const CHILD_BUDGET_MS = 5_000
const CHILD_TIMEOUT_MS = 60_000
const TEST_TIMEOUT_MS = 120_000

// Type arguments each generic export is instantiated with: wide, empty, primitive, never, a variants config and a recipe runtime.
const PROBE_ARGS = [
  'any',
  '{}',
  'string',
  'never',
  "{ className: 'x'; variants: { tone: { soft: {}; loud: {} } } }",
  "RecipeRuntimeFn<{ className: 'x'; variants: { tone: { soft: {} } } }>",
]

const DECLARATION = /^export (?:declare )?(?:type|interface) ([A-Za-z_$][\w$]*)/gm

// The slice of @reference-ui/rust/typegen this contract calls; its dist types do not resolve under NodeNext.
interface TypegenModule {
  emitDtsDetailed(options: { baseSystem: EvaluatedSystemSpec }): { dts: string }
}

// The child prints one line: the traced host count and the codes of its error diagnostics.
interface ChildReport {
  readonly traced: number
  readonly errors: string[]
}

interface CompileRun {
  readonly signal: NodeJS.Signals | null
  readonly status: number | null
  readonly ms: number
  readonly stderr: string
  readonly report: ChildReport | undefined
}

interface TypeExport {
  readonly name: string
  readonly arity: number
}

interface Probe {
  readonly name: string
  readonly propsType: string
  readonly live: boolean
}

interface Producer {
  readonly staged: Readonly<Record<string, string>>
  readonly types: readonly TypeExport[]
  readonly typesFrom: string
}

const CHILD_SOURCE = [
  'const { compileNative } = await import(process.argv[1])',
  'let input = ""',
  'for await (const chunk of process.stdin) input += chunk',
  'const result = await compileNative(JSON.parse(input))',
  'const errors = result.diagnostics.filter(d => d.severity === "error").map(d => d.code)',
  'process.stdout.write(JSON.stringify({ traced: (result.tracedJsxHosts ?? []).length, errors }) + "\\n")',
].join('\n')

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

// Bracket depth steps; the source is masked first, so the `>` of an arrow never closes a list.
const BRACKET_STEP: Readonly<Record<string, number>> = {
  '<': 1,
  '(': 1,
  '[': 1,
  '{': 1,
  '>': -1,
  ')': -1,
  ']': -1,
  '}': -1,
}

// Top-level parameters of the `<...>` list that opens at `open`.
function typeParamCount(source: string, open: number): number {
  let depth = 0
  let commas = 0
  for (let i = open; i < source.length; i++) {
    const ch = source.charAt(i)
    if (ch === ',' && depth === 1) commas++
    depth += BRACKET_STEP[ch] ?? 0
    if (depth === 0) return commas + 1
  }
  throw new Error('unterminated type parameter list')
}

function exportedTypes(dts: string): TypeExport[] {
  // Same-width mask keeps every index valid while removing arrows from the bracket scan.
  const masked = dts.replaceAll('=>', '  ')
  return [...masked.matchAll(DECLARATION)].map(match => {
    const end = (match.index ?? 0) + match[0].length
    return { name: match[1], arity: masked.charAt(end) === '<' ? typeParamCount(masked, end) : 0 }
  })
}

function probesFor(type: TypeExport): Probe[] {
  if (type.arity === 0) return [{ name: `C_${type.name}_0`, propsType: type.name, live: true }]
  return PROBE_ARGS.map((arg, index) => ({
    name: `C_${type.name}_${index}`,
    propsType: `${type.name}<${Array<string>(type.arity).fill(arg).join(', ')}>`,
    live: arg !== 'never',
  }))
}

// One consumer per producer: each export is imported by name and wrapped as style props around a styled host.
function consumerSource(types: readonly TypeExport[], typesFrom: string): string {
  const imported = types.map(type => type.name).filter(name => name !== 'StyleProps')
  const probes = types.flatMap(probesFor)
  return [
    `import { Div } from '${REACT_ENTRY}'`,
    `import type { StyleProps${imported.map(name => `, ${name}`).join('')} } from '${typesFrom}'`,
    ...probes.map(
      probe => `export function ${probe.name}(p: ${probe.propsType} & StyleProps) { return <Div {...p} /> }`
    ),
    `export const Use = () => <>${probes.map(probe => `<${probe.name} color='red' />`).join('')}</>`,
    '',
  ].join('\n')
}

// Small but real: one token category and two recipes, so the declarations carry tokens and recipe variants.
function contractSpec(): EvaluatedSystemSpec {
  return {
    schemaVersion: 1,
    profile: 'reference-ui',
    name: 'consumer-contract',
    tokens: {
      colors: { brand: { primary: { value: '#f00' } }, n100: { value: '#eee' } },
      spacing: { '1': { value: '4px' } },
      radii: { sm: { value: '2px' } },
    },
    fonts: {},
    globalCss: [],
    keyframes: {},
    recipes: {
      button: { variants: { tone: { accent: {}, muted: {} }, size: { sm: {}, lg: {} } } },
      badge: { variants: { tone: { loud: {} } } },
    },
    staticCss: {},
    provenance: [],
  }
}

function stageProject(files: Readonly<Record<string, string>>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'core-consumer-contract-')))
  tempRoots.push(root)
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text, 'utf-8')
  }
  return root
}

function lastLine(stdout: string): string {
  return stdout.trim().split('\n').at(-1) ?? ''
}

function isChildReport(value: unknown): value is ChildReport {
  return (
    typeof value === 'object' &&
    value !== null &&
    'traced' in value &&
    typeof value.traced === 'number' &&
    'errors' in value &&
    Array.isArray(value.errors)
  )
}

function compileInChild(request: unknown, cwd: string): CompileRun {
  const started = performance.now()
  const child = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', CHILD_SOURCE, COMPILE_MODULE],
    {
      cwd,
      env: process.env,
      input: JSON.stringify(request),
      encoding: 'utf-8',
      timeout: CHILD_TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    }
  )
  const ms = performance.now() - started
  const clean = child.signal === null && child.status === 0
  const parsed: unknown = clean ? JSON.parse(lastLine(child.stdout)) : undefined
  return {
    signal: child.signal,
    status: child.status,
    ms,
    stderr: [child.error?.message, child.stderr].filter(Boolean).join('\n').slice(-2000),
    report: isChildReport(parsed) ? parsed : undefined,
  }
}

function traceContract(producer: Producer): { run: CompileRun; live: number } {
  const probes = producer.types.flatMap(probesFor)
  const root = stageProject({
    'package.json': PACKAGE_JSON,
    ...producer.staged,
    'src/all.tsx': consumerSource(producer.types, producer.typesFrom),
  })
  const request = buildCompileRequest({
    spec: contractSpec(),
    requested: [],
    primitiveNames: ELEMENT_JSX_NAMES,
    sourceRoot: root,
    declarationRoot: root,
    include: ['src/**/*.tsx'],
  })
  return { run: compileInChild(request, root), live: probes.filter(probe => probe.live).length }
}

function expectContract(run: CompileRun, live: number): void {
  expect(live, 'the consumer must probe at least one live type').toBeGreaterThan(0)
  expect(run.signal, `compileNative ended on ${run.signal}\n${run.stderr}`).toBeNull()
  expect(run.status, run.stderr).toBe(0)
  expect(run.ms, 'compile wall time').toBeLessThan(CHILD_BUDGET_MS)
  expect(run.report?.errors ?? ['no report'], run.stderr).toEqual([])
  expect(run.report?.traced ?? 0).toBeGreaterThanOrEqual(live)
}

const goldens = readdirSync(FIXTURES)
  .filter(name => name.endsWith('.golden.txt'))
  .sort()

describe('producer to consumer contract', () => {
  it('finds the committed react goldens', () => {
    expect(goldens.length).toBeGreaterThan(0)
  })

  it.each(goldens)('%s traces through the real compile with every probe', { timeout: TEST_TIMEOUT_MS }, golden => {
    const dts = readFileSync(join(FIXTURES, golden), 'utf-8')
    const { run, live } = traceContract({
      staged: { '.reference-ui/react/react.d.mts': dts },
      types: exportedTypes(dts),
      typesFrom: REACT_ENTRY,
    })
    expectContract(run, live)
  })

  it('traces the typegen styled types through the real compile', { timeout: TEST_TIMEOUT_MS }, async () => {
    const typegen = (await import('@reference-ui/rust/typegen')) as unknown as TypegenModule
    const styled = `${BASE_SYSTEM_HEADER}\n${typegen.emitDtsDetailed({ baseSystem: contractSpec() }).dts}`
    // The react entry is the styled host the probes wrap; it reaches the typegen declarations through @reference-ui/styled.
    const react = readFileSync(join(FIXTURES, REACT_GOLDEN), 'utf-8')
    const { run, live } = traceContract({
      staged: {
        '.reference-ui/styled/types/index.d.ts': styled,
        '.reference-ui/react/react.d.mts': react,
      },
      types: exportedTypes(styled),
      typesFrom: STYLED_ENTRY,
    })
    expectContract(run, live)
  })
})
