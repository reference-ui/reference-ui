/**
 * TYP-STYLE-05 consumer fixtures: tsc --noEmit against the typegen printer
 * goldens. Nested condition keys on SystemStyleObject must typecheck without
 * TS2589. FONT-02 discrimination is proven here by assignability, not by
 * scanning the .d.ts string. The harness lives in `./tsc.ts`; production
 * emit_dts still returns a string and does not write the filesystem.
 */

import { describe, expect, it } from 'vitest'
import { compile, readGolden } from './tsc'

describe('TYP-STYLE-05 tsc consumers', () => {
  const emptyDts = readGolden('styles.d.ts')
  const fontDts = readGolden('styles-fonts.d.ts')

  it('TYP-STYLE-05 nested condition keys typecheck without TS2589', () => {
    const result = compile({
      dts: emptyDts,
      source: `import type { SystemStyleObject } from './styles'

export const nested: SystemStyleObject = {
  _hover: {
    _dark: {
      color: 'n300',
    },
  },
}
`,
    })
    expect(result.output, result.output).not.toContain('TS2589')
    expect(result.status, result.output).toBe(0)
  })

  it('TYP-STYLE-05 nested CSS selector typechecks without TS2589', () => {
    const result = compile({
      dts: emptyDts,
      source: `import type { SystemStyleObject } from './styles'

export const nestedSelector: SystemStyleObject = {
  _hover: {
    _dark: {
      '& > span': { color: 'n300' },
    },
  },
}
`,
    })
    expect(result.output, result.output).not.toContain('TS2589')
    expect(result.status, result.output).toBe(0)
  })

  it('TYP-STYLE-05 empty-registry StyleProps accepts any font string', () => {
    const result = compile({
      dts: emptyDts,
      source: `import type { StyleProps } from './styles'

export const open: StyleProps = {
  font: 'literally-anything',
  color: 'n100',
}
`,
    })
    expect(result.status, result.output).toBe(0)
  })

  it('TYP-FONT-02 sans + bold typechecks on populated FontRegistry', () => {
    const result = compile({
      dts: fontDts,
      source: `import type { StyleProps } from './styles'

export const ok: StyleProps = { font: 'sans', weight: 'bold' }
`,
    })
    expect(result.status, result.output).toBe(0)
  })

  it('TYP-FONT-02 sans + mono-only light fails tsc', () => {
    const result = compile({
      dts: fontDts,
      source: `import type { StyleProps } from './styles'

export const bad: StyleProps = { font: 'sans', weight: 'light' }
`,
    })
    expect(result.status, result.output).not.toBe(0)
    expect(result.output).not.toContain('TS2589')
    expect(result.output).toMatch(/TS2322/)
  })
})
