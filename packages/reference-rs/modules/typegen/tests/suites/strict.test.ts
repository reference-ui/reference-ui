/**
 * TYP-STRICT-01–06 tsc consumers against open and strict goldens.
 * Open goldens keep `Token | (string & {})` so arbitrary CSS typechecks.
 * Strict `StyleProps` is the wrapped export: the open object prints as
 * `BaseStyleProps`, and `StyleProps` composes the wrappers as
 * StrictSpacingProps<StrictRadiiProps<StrictColorProps<BaseStyleProps>>>.
 * `SystemStyleObject` is `StyleProps` plus nested condition keys, so JSX style
 * props and object styles narrow the same way, and `r` recurses into the strict
 * `StyleProps`. TYP-STRICT-07 probes both through the tones golden.
 */

import { describe, expect, it } from 'vitest'
import { compile, expectTscReject, readGolden, type TscResult } from '../harness/tsc'

describe('TYP-STRICT tsc consumers', () => {
  const openDts = readGolden('styles.d.ts')
  const strictDts = readGolden('styles-strict.d.ts')
  const tonesStrictDts = readGolden('tones-strict.d.ts')

  it('TYP-STRICT-04 arbitrary CSS typechecks on open goldens', () => {
    const result = compile({
      dts: openDts,
      source: `import type { SystemStyleObject } from './styles'

export const open: SystemStyleObject = {
  color: '#123456',
  p: '13px',
  borderRadius: '16px',
}
`,
    })
    expectOk(result)
  })

  it('TYP-STRICT-01 token and transparent typecheck in strict colors', () => {
    const result = compile({
      dts: strictDts,
      source: `import type { SystemStyleObject } from './styles'

export const ok: SystemStyleObject = {
  color: 'n100',
  bg: 'transparent',
}
`,
    })
    expectOk(result)
  })

  it('TYP-STRICT-01 hex color fails tsc in strict colors', () => {
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = { color: '#123456' }
`
    )
  })

  it("TYP-STRICT-01 named CSS 'red' fails tsc in strict colors", () => {
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = { color: 'red' }
`
    )
  })

  it('TYP-STRICT-02 dump RadiusToken typechecks in strict radii', () => {
    const result = compile({
      dts: strictDts,
      source: `import type { SystemStyleObject } from './styles'

export const ok: SystemStyleObject = { borderRadius: 'md' }
`,
    })
    expectOk(result)
  })

  it("TYP-STRICT-02 length '16px' fails tsc in strict radii", () => {
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = { borderRadius: '16px' }
`
    )
  })

  it('TYP-STRICT-03 dump SpacingToken typechecks in strict spacing', () => {
    const result = compile({
      dts: strictDts,
      source: `import type { SystemStyleObject } from './styles'

export const ok: SystemStyleObject = { p: '1r', mt: '4' }
`,
    })
    expectOk(result)
  })

  it("TYP-STRICT-03 length '13px' fails tsc in strict spacing", () => {
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = { p: '13px' }
`
    )
  })

  it('TYP-STRICT-05 colors and radii wrappers both apply', () => {
    const ok = compile({
      dts: strictDts,
      source: `import type { SystemStyleObject } from './styles'

export const both: SystemStyleObject = {
  color: 'n100',
  borderRadius: 'md',
}
`,
    })
    expectOk(ok)
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const badColor: SystemStyleObject = { color: '#123456', borderRadius: 'md' }
`
    )
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const badRadius: SystemStyleObject = { color: 'n100', borderRadius: '16px' }
`
    )
  })

  it('TYP-STRICT-07 StyleProps and SystemStyleObject accept tokens, toned colors and keywords', () => {
    expectOk(
      compile({
        dts: tonesStrictDts,
        source: `import type { StyleProps, SystemStyleObject } from './styles'

export const toned: StyleProps = { bg: 'blue.500/medium' }
export const keyword: StyleProps = { bg: 'transparent' }
export const token: StyleProps = { bg: 'blue.500' }
export const objToned: SystemStyleObject = { bg: 'blue.500/medium' }
export const objKeyword: SystemStyleObject = { bg: 'transparent' }
export const objToken: SystemStyleObject = { bg: 'blue.500' }
`,
      })
    )
  })

  it('TYP-STRICT-07 StyleProps rejects off-token colors and nested r values', () => {
    for (const [prop, code] of REJECTED_PROPS) {
      expectRejectedWithDirective(tonesStrictDts, rejectionSource('StyleProps', prop), code)
    }
  })

  it('TYP-STRICT-07 SystemStyleObject rejects the same values as StyleProps', () => {
    for (const [prop, code] of REJECTED_PROPS) {
      expectRejectedWithDirective(tonesStrictDts, rejectionSource('SystemStyleObject', prop), code)
    }
  })
})

// One probe per line, so a single @ts-expect-error covers every error it raises,
// including elaboration into a nested r value. An undeclared tone suffix with a
// close literal reports TS2820, the "did you mean" sibling of TS2322, as
// tones.test.ts already allows.
const REJECTED_PROPS: [string, RegExp][] = [
  ["bg: 'blue.500/50'", /TS(2322|2820)/],
  ["bg: 'not-a-token'", /TS2322/],
  ["r: { md: { bg: '#fff' } }", /TS2322/],
]

function rejectionSource(type: string, prop: string): string {
  return `import type { ${type} } from './styles'

export const bad: ${type} = {
  // @ts-expect-error: strict colors reject this value (TS2322)
  ${prop},
}
`
}

// Two halves, as in surface.test.ts: the bare form must fail with the expected
// code, so the directive cannot hide an unrelated error, and the @ts-expect-error
// form must typecheck, so the rejection stays pinned if the type widens later.
function expectRejectedWithDirective(dts: string, policed: string, code: RegExp) {
  const bare = policed
    .split('\n')
    .filter(line => !line.includes('@ts-expect-error'))
    .join('\n')
  expectTscReject(compile({ dts, source: bare }), code)
  expectOk(compile({ dts, source: policed }))
}

function expectOk(result: TscResult) {
  expect(result.output, result.output).not.toContain('TS2589')
  expect(result.status, result.output).toBe(0)
}

function expectAssignFail(dts: string, source: string) {
  const result = compile({ dts, source })
  expect(result.status, result.output).not.toBe(0)
  expect(result.output).not.toContain('TS2589')
  expect(result.output).toMatch(/TS2322/)
}
