import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderSystemStyleObjectDts } from './strict'
import type { SystemStyleObject } from '../public/system-style-object'

const ssoSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../public/system-style-object.ts'),
  'utf-8'
)

function expectOwnedDeclaration(out: string) {
  expect(out).not.toContain('@reference-ui/styled')
  expect(out).not.toContain('StyledSystemStyleObject')
  expect(out).toContain(
    "import type { Properties } from '../../../styled/types/csstype';"
  )
  expect(out).toContain(
    'export interface BaseSystemStyleObject extends CssProperties, CanonAliasOverlay {}'
  )
}

describe('strict-token system-style-object codegen', () => {
  it('TYP-STYLE-01 owns SystemStyleObject without @reference-ui/styled', () => {
    expect(ssoSource).not.toContain('@reference-ui/styled')
    expect(ssoSource).not.toContain('StyledSystemStyleObject')
    expect(ssoSource).toContain("import type { Properties } from 'csstype'")
    expect(ssoSource).toContain('export interface BaseSystemStyleObject')
    expect(ssoSource).toContain('export type SystemStyleObject')
  })

  it('TYP-STYLE-01 accepts primitive authoring props and nested selectors', () => {
    const authored: SystemStyleObject = {
      display: 'flex',
      width: '100%',
      flex: 1,
      bg: 'red',
      p: '8px',
      px: '4px',
      mt: '1rem',
      gap: '8px',
      maxW: '400px',
      flexDir: 'column',
      _hover: {
        color: 'blue',
        '& > span': { opacity: 0.8 },
      },
    }
    expect(authored.display).toBe('flex')
  })

  it('returns the identity wrapper when no categories are active', () => {
    const out = renderSystemStyleObjectDts([])
    expectOwnedDeclaration(out)
    expect(out).toContain('export type SystemStyleObject = BaseSystemStyleObject & {')
    expect(out).not.toContain('StrictColorProps')
    expect(out).not.toContain('StrictRadiiProps')
  })

  it('wraps with StrictColorProps when colors is active', () => {
    const out = renderSystemStyleObjectDts(['colors'])
    expectOwnedDeclaration(out)
    expect(out).toContain("import type { StrictColorProps } from './strict-colors';")
    expect(out).toContain(
      'export type SystemStyleObject = StrictColorProps<BaseSystemStyleObject> & {'
    )
  })

  it('composes multiple wrappers in declaration order', () => {
    const out = renderSystemStyleObjectDts(['colors', 'radii'])
    expectOwnedDeclaration(out)
    expect(out).toContain("import type { StrictColorProps } from './strict-colors';")
    expect(out).toContain("import type { StrictRadiiProps } from './strict-radii';")
    expect(out).toContain(
      'export type SystemStyleObject = StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>> & {'
    )
  })

  it('ignores duplicate categories', () => {
    const out = renderSystemStyleObjectDts(['colors', 'colors'])
    expectOwnedDeclaration(out)
    const matches = out.match(/StrictColorProps/g) ?? []
    // one in the import, one in the alias
    expect(matches).toHaveLength(2)
  })

  it('ignores unsupported categories that have no codegen wrapper yet', () => {
    const out = renderSystemStyleObjectDts(['spacing'])
    expectOwnedDeclaration(out)
    expect(out).toContain('export type SystemStyleObject = BaseSystemStyleObject & {')
    expect(out).not.toContain('StrictSpacingProps')
  })
})
