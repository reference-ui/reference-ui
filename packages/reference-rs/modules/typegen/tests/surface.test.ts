/**
 * TYP-SURFACE T1-T4: full-surface StyleProps acceptance against the live typegen
 * emitter. T1 builds its consumer programmatically from the canon dialect lists,
 * never hand-enumerated, and typechecks it against real emitDtsSync output for
 * the full style dump and a colors-only spec. T2 probes per-family values,
 * numerics, responsive arrays, nesting, selectors, and custom properties. T3
 * pins rejection of bogus keys with self-policing @ts-expect-error negatives.
 * T4 pins strict wrappers: colors narrow while Open keys stay open, and absent
 * categories emit no wrapper. The tsc harness lives in ./tsc.ts.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadDialect } from '../../canon/generate/dialect'
import { loadPlatformCss } from '../../canon/generate/platform'
import { emitDtsSync } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'
import { compile, expectTscOk, expectTscReject } from './tsc'

const here = dirname(fileURLToPath(import.meta.url))
const contractsDir = resolve(here, '../../../contracts/fixtures')

// Keys the emitter deliberately withholds from the StyleProps block: font and
// weight belong to the FontProps mix-in, variant and colorMode are primitive
// metadata. Mirrors the widened rule's documented exclusions.
const OWNED_KEYS = new Set(['font', 'weight', 'variant', 'colorMode'])

function readSpec(name: string): EvaluatedSystemSpec {
  return JSON.parse(readFileSync(resolve(contractsDir, name), 'utf8')) as EvaluatedSystemSpec
}

// Colors-only spec shaped like extend-library: the Cause-B shape. Token
// categories are the only variable under test, so conditions, breakpoints,
// and provenance stay untouched.
function colorsOnlySpec(full: EvaluatedSystemSpec): EvaluatedSystemSpec {
  const spec = structuredClone(full)
  spec.tokens = { colors: spec.tokens['colors'] }
  spec.fonts = {}
  spec.recipes = {}
  return spec
}

// The runtime-accepted key set, mirroring atomic build_style_prop_names:
// every canonical name plus every alias plus every reference prop, minus the
// owned keys above. container is unconditional emitter output with no canon
// row, so it joins explicitly.
async function widenedKeys(): Promise<string[]> {
  const platformCss = await loadPlatformCss()
  const dialect = loadDialect(platformCss)
  const keys = new Set<string>()
  for (const prop of dialect.canonicalProperties) keys.add(prop.name)
  for (const alias of dialect.aliases) keys.add(alias.alias)
  for (const refProp of dialect.referenceProps) keys.add(refProp)
  keys.add('container')
  for (const owned of OWNED_KEYS) keys.delete(owned)
  return [...keys].sort()
}

// One fresh string literal per key; r is the lone Record-valued key and takes
// an empty object. Quoted keys keep reserved-adjacent names safe.
function fullSurfaceSource(keys: string[]): string {
  const lines = keys.map(key =>
    key === 'r' ? `  ${JSON.stringify(key)}: {},` : `  ${JSON.stringify(key)}: 't1',`
  )
  return `import type { SystemStyleObject } from './styles'

export const surface: SystemStyleObject = {
${lines.join('\n')}
}
`
}

function stripDirectives(policed: string): string {
  return policed
    .split('\n')
    .filter(line => !line.includes('@ts-expect-error'))
    .join('\n')
}

// A rejection pin in two halves: the bare form must fail with the expected
// diagnostic (so the directive cannot swallow an incidental error), and the
// @ts-expect-error form must pass (self-policing against future widening).
function expectKeyRejected(dts: string, policed: string, code: RegExp): void {
  expectTscReject(compile({ dts, source: stripDirectives(policed) }), code)
  expectTscOk(compile({ dts, source: policed }))
}

describe('TYP-SURFACE full StyleProps surface', async () => {
  const fullSpec = readSpec('evaluated-system-spec.json')
  const tokenLightSpec = readSpec('evaluated-system-spec-token-light.json')
  const colorsOnly = colorsOnlySpec(fullSpec)
  const keys = await widenedKeys()

  it('T1 enumerates the runtime-accepted key set from canon lists', () => {
    expect(keys.length).toBeGreaterThan(1000)
    for (const key of ['display', 'fontSize', 'gap', 'borderStyle', 'size', 'container', 'r']) {
      expect(keys).toContain(key)
    }
    for (const owned of OWNED_KEYS) {
      expect(keys).not.toContain(owned)
    }
  })

  it('T1 full-surface positive on the full style dump', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectTscOk(compile({ dts, source: fullSurfaceSource(keys) }))
  })

  it('T1 full-surface positive on the colors-only spec', () => {
    const dts = emitDtsSync({ baseSystem: colorsOnly })
    expectTscOk(compile({ dts, source: fullSurfaceSource(keys) }))
  })

  it('T2 token literal and arbitrary string per token family', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const family: SystemStyleObject = {
  color: 'blue.500',
  backgroundColor: '#123456',
  p: '2',
  margin: '13px',
  borderRadius: 'md',
  borderTopLeftRadius: '16px',
}
`,
      })
    )
  })

  it('T2 numbers on Open keys', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const numerics: SystemStyleObject = {
  width: 42,
  zIndex: 0,
  opacity: 1,
}
`,
      })
    )
  })

  it('T2 responsive arrays with null holes', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const responsive: SystemStyleObject = {
  mt: ['4', null],
  color: ['blue.500', null],
}
`,
      })
    )
  })

  it('T2 nested conditions and selectors', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const nested: SystemStyleObject = {
  _hover: { color: 'blue.500' },
  '@sm': { p: '2' },
  '& > span': { color: 'red' },
}
`,
      })
    )
  })

  it('T2 custom property assignment', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const custom: SystemStyleObject = {
  '--foo': 42,
}
`,
      })
    )
  })

  it('T3 bogus top-level key is rejected', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectKeyRejected(
      dts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = {
  // @ts-expect-error: bogus keys must be rejected with TS2353
  definitelyNotAProp: 'x',
}
`,
      /TS2353/
    )
  })

  it('T3 near-miss typo is rejected', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectKeyRejected(
      dts,
      `import type { SystemStyleObject } from './styles'

export const typo: SystemStyleObject = {
  // @ts-expect-error: the British spelling is not a style prop (TS2561)
  colour: 'red',
}
`,
      /TS2561/
    )
  })

  it('T3 junk key nested under a condition is rejected', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })
    expectKeyRejected(
      dts,
      `import type { SystemStyleObject } from './styles'

export const nestedBad: SystemStyleObject = {
  _hover: {
    // @ts-expect-error: nested bogus keys must be rejected with TS2353
    definitelyNotAProp: 'x',
  },
}
`,
      /TS2353/
    )
  })

  it('T4 strict colors rejects a non-token string', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec, strict: ['colors'] })
    expectKeyRejected(
      dts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = {
  // @ts-expect-error: strict colors admit tokens and keywords only (TS2322)
  color: '#123456',
}
`,
      /TS2322/
    )
  })

  it('T4 Open keys stay open under strict colors', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec, strict: ['colors'] })
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const open: SystemStyleObject = {
  color: 'blue.500',
  width: 42,
  display: 'flex',
}
`,
      })
    )
  })

  it('T4 strict on a colors-absent spec emits no StrictColorProps wrapper', () => {
    const dts = emitDtsSync({ baseSystem: tokenLightSpec, strict: ['colors'] })
    expect(dts).not.toContain('StrictColorProps')
    expectTscOk(
      compile({
        dts,
        source: `import type { SystemStyleObject } from './styles'

export const open: SystemStyleObject = { color: '#123456' }
`,
      })
    )
  })
})
