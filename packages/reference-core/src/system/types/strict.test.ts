import { describe, expect, it } from 'vitest'
import { renderSystemStyleObjectDts } from './strict'

describe('strict-token system-style-object codegen', () => {
  it('returns the identity wrapper when no categories are active', () => {
    const out = renderSystemStyleObjectDts([])
    expect(out).toContain(
      "import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types';"
    )
    expect(out).toContain('export type SystemStyleObject = StyledSystemStyleObject;')
    expect(out).not.toContain('StrictColorProps')
    expect(out).not.toContain('StrictRadiiProps')
  })

  it('wraps with StrictColorProps when colors is active', () => {
    const out = renderSystemStyleObjectDts(['colors'])
    expect(out).toContain("import type { StrictColorProps } from './colors';")
    expect(out).toContain('export type SystemStyleObject = StrictColorProps<StyledSystemStyleObject>;')
  })

  it('composes multiple wrappers in declaration order', () => {
    const out = renderSystemStyleObjectDts(['colors', 'radii'])
    expect(out).toContain("import type { StrictColorProps } from './colors';")
    expect(out).toContain("import type { StrictRadiiProps } from './radii';")
    expect(out).toContain(
      'export type SystemStyleObject = StrictRadiiProps<StrictColorProps<StyledSystemStyleObject>>;'
    )
  })

  it('ignores duplicate categories', () => {
    const out = renderSystemStyleObjectDts(['colors', 'colors'])
    const matches = out.match(/StrictColorProps/g) ?? []
    // one in the import, one in the alias
    expect(matches).toHaveLength(2)
  })

  it('ignores unsupported categories that have no codegen wrapper yet', () => {
    const out = renderSystemStyleObjectDts(['spacing'])
    expect(out).toContain('export type SystemStyleObject = StyledSystemStyleObject;')
    expect(out).not.toContain('StrictSpacingProps')
  })
})
