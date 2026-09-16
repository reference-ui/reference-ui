/**
 * Native Node-API seam tests for Reference UI type declaration generation.
 * Verifies that emitDtsSync and emitDts lower EvaluatedSystemSpec fixtures via base-system.
 * Asserts open and strict declaration output, empty category aliases, recipe gating, and error boundaries.
 * Enforces pure in-memory string output with no Panda dependencies or runtime code.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { emitDts, emitDtsSync } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'

const here = dirname(fileURLToPath(import.meta.url))
const rootContracts = resolve(here, '../../../contracts/fixtures')

function readFixture(name: string): EvaluatedSystemSpec {
  const filePath = resolve(rootContracts, name)
  return JSON.parse(readFileSync(filePath, 'utf8')) as EvaluatedSystemSpec
}

describe('typegen native seam', () => {
  const fullSpec = readFixture('evaluated-system-spec.json')
  const tokenLightSpec = readFixture('evaluated-system-spec-token-light.json')

  it('TYP-NATIVE-01 emits complete declarations from standard evaluated system spec', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })

    expect(typeof dts).toBe('string')
    expect(dts).toContain("export type ColorToken = '_private.secret' | 'bg.canvas' | 'blue.500' | 'red.500';")
    expect(dts).toContain("export type SpacingToken = '1' | '2' | '4';")
    expect(dts).toContain("export type RadiusToken = 'md' | 'sm';")
    expect(dts).toContain('export interface FontRegistry {')
    expect(dts).toContain("'sans': { 'bold': true; 'normal': true };")
    expect(dts).toContain('export type ButtonVariantProps =')
    expect(dts).toContain('export type ButtonCompoundVariant =')
    expect(dts).toContain('export type StyleConditionKey =')
    expect(dts).toContain("'@sm'")
    expect(dts).toContain('export type SystemStyleObject = StyleProps &')
  })

  it('TYP-NATIVE-02 produces deterministic byte-identical output across repeated calls', async () => {
    const syncOutput1 = emitDtsSync({ baseSystem: fullSpec })
    const syncOutput2 = emitDtsSync({ baseSystem: fullSpec })
    const asyncOutput = await emitDts({ baseSystem: fullSpec })

    expect(syncOutput1).toBe(syncOutput2)
    expect(asyncOutput).toBe(syncOutput1)
  })

  it('TYP-NATIVE-03 strictly respects requested strict category wrappers', () => {
    const strictDts = emitDtsSync({
      baseSystem: fullSpec,
      strict: ['colors', 'radii'],
    })

    expect(strictDts).toContain('StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>')
    expect(strictDts).not.toContain('StrictSpacingProps')
  })

  it('TYP-NATIVE-04 emits never for empty categories and omits recipes when none defined', () => {
    const dts = emitDtsSync({ baseSystem: tokenLightSpec })

    expect(dts).toContain('export type ColorToken = never;')
    expect(dts).toContain('export type SpacingToken = never;')
    expect(dts).toContain("export type RadiusToken = 'sm';")
    expect(dts).toContain('export interface FontRegistry {}')
    expect(dts).not.toContain('VariantProps')
    expect(dts).not.toContain('CompoundVariant')
    expect(dts).toContain('export type StyleConditionKey =')
    expect(dts).toContain('export type StyleProps = FontProps &')
    expect(dts).toContain('export type SystemStyleObject = StyleProps &')
  })

  it('TYP-NATIVE-05 rejects unsupported schema versions and unknown fields', () => {
    const invalidVersion = { ...fullSpec, schemaVersion: 999 }
    expect(() => emitDtsSync({ baseSystem: invalidVersion })).toThrow(/schema\s*version/i)

    const unknownFields = { ...fullSpec, rogueProperty: 'illegal' } as unknown as EvaluatedSystemSpec
    expect(() => emitDtsSync({ baseSystem: unknownFields })).toThrow(/unknown field/i)
  })

  it('TYP-NATIVE-06 contains no pandacss imports, jsx factory, or runtime code', () => {
    const dts = emitDtsSync({ baseSystem: fullSpec })

    expect(dts).not.toContain('@pandacss')
    expect(dts).not.toContain('styled.')
    expect(dts).not.toContain('export const ')
    expect(dts).not.toContain('function ')
  })

  it('TYP-NATIVE-07 exports working emitDtsSync and emitDts from package dist', async () => {
    const distTypegen = await import('../../../dist/typegen.mjs')
    expect(typeof distTypegen.emitDtsSync).toBe('function')
    expect(typeof distTypegen.emitDts).toBe('function')
    const dts = distTypegen.emitDtsSync({ baseSystem: fullSpec })
    expect(dts).toContain("export type ColorToken = '_private.secret' | 'bg.canvas' | 'blue.500' | 'red.500';")
  })
})
