/**
 * TYP-STRICT-01–05 tsc consumers against open and strict goldens.
 * Open goldens keep `Token | (string & {})` so arbitrary CSS typechecks.
 * Strict proofs assign to SystemStyleObject (the wrapped export); StyleProps
 * stays open-mode on purpose. Wrappers compose as
 * StrictSpacingProps<StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>>.
 */

import { describe, expect, it } from 'vitest'
import { compile, readGolden, type TscResult } from './tsc'

describe('TYP-STRICT tsc consumers', () => {
  const openDts = readGolden('styles.d.ts')
  const strictDts = readGolden('styles-strict.d.ts')

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
`,
    )
  })

  it("TYP-STRICT-01 named CSS 'red' fails tsc in strict colors", () => {
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const bad: SystemStyleObject = { color: 'red' }
`,
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
`,
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
`,
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
`,
    )
    expectAssignFail(
      strictDts,
      `import type { SystemStyleObject } from './styles'

export const badRadius: SystemStyleObject = { color: 'n100', borderRadius: '16px' }
`,
    )
  })
})

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
