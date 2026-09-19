/**
 * Seam rejection stations for foreign or malformed baseSystem specs (ATM-TOKEN-10).
 * Proves atomic and typegen share one EvaluatedSystemSpec shape: valid specs compile,
 * foreign dumps and malformed envelopes come back as error diagnostics, and a missing
 * spec throws instead of silently binding an empty system. Also pins the G1 invariants
 * that every style plan carries a non-empty system and neither stylesheet mentions data-panda-theme.
 */
import { describe, expect, it } from 'vitest'
import { compileSync } from '../js/index.js'
import type { EvaluatedSystemSpec } from '../js/types.js'
import evaluatedSystemSpecJson from '../../../contracts/fixtures/evaluated-system-spec.json'
import invalidVersionJson from '../../../contracts/fixtures/evaluated-system-spec-invalid-version.json'
import unknownFieldJson from '../../../contracts/fixtures/evaluated-system-spec-unknown-field.json'
import { LAYER_PREAMBLE } from './helpers.js'

const specSystem = evaluatedSystemSpecJson as EvaluatedSystemSpec

const SOURCES = [
  {
    path: 'src/index.tsx',
    content: `
      import { css } from '@reference-ui/react';
      export const a = css({ color: 'blue.500' });
      export const b = css({ _hover: { color: 'red.500' } });
      export const c = css({ _dark: { color: 'blue.500' } });
    `,
  },
]

describe('ATM-TOKEN-10 spec rejection', () => {
  it('rejects core portable shape with a diagnostic naming the foreign field', () => {
    const result = compileSync({
      baseSystem: {
        name: 'core-portable-system',
        fragment: 'packages/reference-core/src/system/base/fragments/index.ts',
        jsxElements: ['styled.div'],
      } as unknown as EvaluatedSystemSpec,
      files: SOURCES,
    })

    expect(result.diagnostics).toHaveLength(1)
    const [rejection] = result.diagnostics
    expect(rejection!.severity).toBe('error')
    expect(rejection!.message).toContain('baseSystem')
    expect(rejection!.message).toContain('fragment')
    expect(result.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
    expect(result.atomCount).toBe(0)
    expect(result.css?.classes ?? {}).toEqual({})
    expect(result.runtime.stylePlans).toEqual([])
  })

  it('rejects legacy flat dumps that predate the evaluated spec', () => {
    const result = compileSync({
      baseSystem: {
        name: 'flat-dump',
        tokens: {
          'colors.n300': {
            category: 'colors',
            cssVar: '--colors-n300',
            light: '#d4d4d8',
            dark: '#3f3f46',
          },
        },
      } as unknown as EvaluatedSystemSpec,
      files: SOURCES,
    })

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]!.severity).toBe('error')
    expect(result.diagnostics[0]!.message).toContain('baseSystem')
    expect(result.runtime.stylePlans).toEqual([])
  })

  it('rejects specs missing required collections', () => {
    const result = compileSync({
      baseSystem: {
        schemaVersion: 1,
        profile: 'reference-ui',
        name: 'thin-system',
      } as unknown as EvaluatedSystemSpec,
      files: SOURCES,
    })

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]!.severity).toBe('error')
    expect(result.diagnostics[0]!.message).toContain('tokens')
  })

  it('rejects unknown schema versions and foreign profiles', () => {
    const version = compileSync({
      baseSystem: invalidVersionJson as unknown as EvaluatedSystemSpec,
      files: SOURCES,
    })
    expect(version.diagnostics).toHaveLength(1)
    expect(version.diagnostics[0]!.message).toContain('unsupported schema version 2')

    const profile = compileSync({
      baseSystem: { ...specSystem, profile: 'panda' } as EvaluatedSystemSpec,
      files: SOURCES,
    })
    expect(profile.diagnostics).toHaveLength(1)
    expect(profile.diagnostics[0]!.message).toContain('unsupported profile "panda"')
  })

  it('rejects unknown top-level fields', () => {
    const result = compileSync({
      baseSystem: unknownFieldJson as unknown as EvaluatedSystemSpec,
      files: SOURCES,
    })

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]!.severity).toBe('error')
    expect(result.diagnostics[0]!.message).toContain('unexpectedProperty')
  })

  it('rejects empty system names', () => {
    const result = compileSync({
      baseSystem: { ...specSystem, name: '' },
      files: SOURCES,
    })

    expect(result.diagnostics).toHaveLength(1)
    expect(result.diagnostics[0]!.severity).toBe('error')
    expect(result.diagnostics[0]!.message).toContain('name')
  })

  it('throws when baseSystem is missing instead of binding an empty system', () => {
    expect(() => compileSync({ files: SOURCES } as never)).toThrow(/baseSystem/)
  })

  /**
   * RS-KNOWN-RED-001 closed by Forge Slice 1 (§11): the fixture's
   * `opacity: "1"` no longer warns at all — bare values miss silently off
   * color props — so the 6-copy cartesian re-warn is gone with the warning.
   */
  it('accepts string-serialized specs like typegen', () => {
    const result = compileSync({
      baseSystem: JSON.stringify(specSystem) as unknown as EvaluatedSystemSpec,
      files: SOURCES,
    })

    // The fixture spec carries a button recipe whose `opacity: "1"` passes
    // through silently, exactly as TSX `css({ opacity: '1' })` does (§11).
    expect(result.diagnostics).toEqual([])
    expect(result.runtime.stylePlans.length).toBeGreaterThan(0)
    expect(Object.keys(result.runtime.recipes)).toContain('lib-test-system__button')
  })

  it('keeps non-empty plan systems and zero data-panda-theme on valid specs', () => {
    const result = compileSync({ baseSystem: specSystem, files: SOURCES })

    expect(result.runtime.stylePlans.length).toBeGreaterThan(0)
    for (const plan of result.runtime.stylePlans) {
      expect(plan.system).toBe('lib-test-system')
    }
    expect(result.stylesheet).toContain('[data-color-mode=dark]')
    expect(result.stylesheet).not.toContain('data-panda-theme')
    expect(result.stylesheet).not.toContain('[data-theme=')
    expect(result.portableStylesheet ?? '').not.toContain('data-panda-theme')
    expect(result.portableStylesheet ?? '').not.toContain('[data-theme=')
  })
})
