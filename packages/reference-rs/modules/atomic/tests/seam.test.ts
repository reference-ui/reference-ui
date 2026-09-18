/**
 * Seam and contract tests for Reference UI atomic runtime plans (ATM-SEAM-01, N2).
 * Verifies byte-level parity of lookup key serialization between Rust and TypeScript.
 * Asserts slot-based last-wins cascade merging across aliases, shorthands, and important flags.
 * Proves system namespace isolation and property exclusion of variant/colorMode.
 */
import { describe, expect, it } from 'vitest'
import {
  compileSync,
  createStylePlanIndex,
  mergeDeclarations,
  mergeStylePlans,
  serializeCanonicalJson,
  serializeLookupKey,
} from '../js/index.js'
import type { EvaluatedSystemSpec, NativeRuntimeArtifact } from '../js/types.js'
import { layerClassNames, LIB_SYSTEM_SPEC } from './helpers.js'
import nativeRuntimeArtifactJson from '../../../contracts/fixtures/native-runtime-artifact.json'
import compileResultJson from '../../../contracts/fixtures/compile-result.json'
import evaluatedSystemSpecJson from '../../../contracts/fixtures/evaluated-system-spec.json'

const specSystem = evaluatedSystemSpecJson as EvaluatedSystemSpec

describe('ATM-SEAM-01 atomic runtime style plans', () => {
  const artifact = nativeRuntimeArtifactJson as NativeRuntimeArtifact

  it('serializes canonical JSON with sorted keys matching Rust serializer', () => {
    const val = { b: 1, a: { z: 9, y: 8 } }
    expect(serializeCanonicalJson(val)).toBe('{"a":{"y":8,"z":9},"b":1}')

    const withNullArray = ['1', null, '4']
    expect(serializeCanonicalJson(withNullArray)).toBe('["1",null,"4"]')

    const rObj = { $r: 2 }
    expect(serializeCanonicalJson(rObj)).toBe('{"$r":2}')
  })

  it('serializes five-tuple lookup keys matching Rust format', () => {
    const key1 = serializeLookupKey(
      'lib-test-system',
      ['_hover'],
      'color',
      'red.500',
      false
    )
    expect(key1).toBe('["lib-test-system",["_hover"],"color","red.500",false]')

    const key2 = serializeLookupKey(
      'lib-test-system',
      [],
      'padding',
      ['1', null, '4'],
      false
    )
    expect(key2).toBe('["lib-test-system",[],"padding",["1",null,"4"],false]')

    const key3 = serializeLookupKey('lib-test-system', [], 'marginTop', { $r: 2 }, true)
    expect(key3).toBe('["lib-test-system",[],"marginTop",{"$r":2},true]')
  })

  it('creates style plan index from NativeRuntimeArtifact fixture', () => {
    const index = createStylePlanIndex(artifact)
    expect(index.size).toBe(artifact.stylePlans.length)

    // Lookup color: blue.500
    const colorKey = serializeLookupKey('lib-test-system', [], 'color', 'blue.500', false)
    const colorDecls = index.get(colorKey)
    expect(colorDecls).toBeDefined()
    expect(colorDecls).toEqual([
      { slot: 'color', className: 'lib-test-system__c_blue-500' },
    ])

    // Lookup four-side shorthand p: 2
    const pKey = serializeLookupKey('lib-test-system', [], 'p', '2', false)
    const pDecls = index.get(pKey)
    expect(pDecls).toBeDefined()
    expect(pDecls).toHaveLength(4)
    expect(pDecls!.map(d => d.slot)).toEqual([
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
    ])
  })

  it('ATM-MERGE-01: multi-argument calls resolve last value per property in runtime', () => {
    const index = createStylePlanIndex(artifact)
    // Query color: blue.500 then color: red.500 (both address slot "color")
    const merged = mergeStylePlans(index, [
      { system: 'lib-test-system', prop: 'color', value: 'blue.500' },
      { system: 'lib-test-system', prop: 'color', value: 'red.500', important: true },
    ])
    // The later declaration replaces the earlier one on slot "color"
    expect(merged).toBe('lib-test-system__c_red-500_i')
  })

  it('ATM-MERGE-02: aliases and shorthands collapse to last-authored slot', () => {
    const index = createStylePlanIndex(artifact)
    // Four-side shorthand p: 2 expands to 4 slots (paddingTop, paddingRight, paddingBottom, paddingLeft)
    // An explicit paddingTop override after p should replace only paddingTop
    const decls = [
      ...index.get(serializeLookupKey('lib-test-system', [], 'p', '2', false))!,
      { slot: 'paddingTop', className: 'lib-test-system__pt_4' },
    ]
    const merged = mergeDeclarations(decls)
    expect(merged).toContain('lib-test-system__pt_4')
    expect(merged).not.toContain('lib-test-system__pt_2')
    expect(merged).toContain('lib-test-system__pr_2')
    expect(merged).toContain('lib-test-system__pb_2')
    expect(merged).toContain('lib-test-system__pl_2')
  })

  it('preserves system namespace isolation on identical authored props', () => {
    const index = createStylePlanIndex(artifact)
    // Both systems author font: "sans", but keys and classes differ
    const key1 = serializeLookupKey('lib-test-system', [], 'font', 'sans', false)
    const key2 = serializeLookupKey('other-system', [], 'font', 'sans', false)

    expect(key1).not.toBe(key2)

    const decls1 = index.get(key1)!
    const decls2 = index.get(key2)!

    expect(decls1[0].className).toBe('lib-test-system__ff_sans')
    expect(decls2[0].className).toBe('other-system__ff_sans')
  })

  it('ATM-SEAM-01: compileSync produces complete NativeRuntimeArtifact and valid stylesheets', () => {
    const result = compileSync({
      baseSystem: specSystem,
      files: [
        {
          path: 'src/index.tsx',
          content: `
            import { css } from '@reference-ui/react';
            export const c1 = css({ color: 'blue.500', p: '2' });
            export const c2 = css({ _hover: { color: 'red.500' } });
          `,
        },
      ],
    })

    expect(result.stylesheet).toContain('@layer')
    expect(result.stylesheet).toContain('utilities')
    expect(result.portableStylesheet).toBeDefined()
    expect(result.portableStylesheet).toContain('@layer')

    // NativeRuntimeArtifact checks
    expect(result.runtime).toBeDefined()
    expect(result.runtime.schemaVersion).toBe(1)
    expect(result.runtime.stylePlans.length).toBeGreaterThan(0)
    expect(result.runtime.stylePropNames).toContain('color')
    expect(result.runtime.stylePropNames).toContain('p')
    expect(result.runtime.stylePropNames).not.toContain('variant')
    expect(result.runtime.stylePropNames).not.toContain('colorMode')

    // Find style plan for color: blue.500
    const colorPlan = result.runtime.stylePlans.find(
      p => p.prop === 'color' && p.value === 'blue.500'
    )
    expect(colorPlan).toBeDefined()
    expect(colorPlan!.system).toBe('lib-test-system')
    expect(colorPlan!.declarations[0].slot).toBe('color')

    // Find style plan for hover color
    const hoverPlan = result.runtime.stylePlans.find(
      p => p.prop === 'color' && p.value === 'red.500' && p.when.includes('_hover')
    )
    expect(hoverPlan).toBeDefined()
    expect(hoverPlan!.declarations[0].slot).toBe('hover:color')
  })

  it('M0-fix19-A: bare production system names keep plan↔stylesheet parity', () => {
    // Replays the in-container color-mode shape: a bare package system name
    // (no scope to escape) compiling a token declaration. The stale linux
    // engine emitted bare utilities for qualified plans, ghosting 3394/3394
    // plan classes; the fixed engine must keep every plan class in the sheet.
    const spec = { ...LIB_SYSTEM_SPEC, name: 'color-mode' }
    const result = compileSync({
      baseSystem: spec as EvaluatedSystemSpec,
      files: [
        {
          path: 'src/index.tsx',
          content: `
            import { css } from '@reference-ui/react';
            export const token = css({ color: 'blue.600' });
            export const spacing = css({ p: '4' });
          `,
        },
      ],
    })

    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])

    const tokenPlan = result.runtime.stylePlans.find(
      p => p.prop === 'color' && p.value === 'blue.600'
    )
    expect(tokenPlan).toBeDefined()
    expect(tokenPlan!.system).toBe('color-mode')
    expect(tokenPlan!.declarations[0].slot).toBe('color')
    expect(tokenPlan!.declarations[0].className.startsWith('color-mode__')).toBe(true)

    const utilities = layerClassNames(result.stylesheet, 'utilities')
    const planClasses = result.runtime.stylePlans.flatMap(plan =>
      plan.declarations.map(decl => decl.className)
    )
    expect(planClasses.length).toBeGreaterThan(0)
    expect(planClasses.filter(name => !utilities.has(name))).toEqual([])
  })

  it('rejects non-canonical numbers with diagnostics during compilation', () => {
    const result = compileSync({
      baseSystem: specSystem,
      files: [
        {
          path: 'src/invalid.tsx',
          content: `
            import { css } from '@reference-ui/react';
            export const c = css({
              padding: '01' as any,
              margin: '0x10' as any,
              width: 'Infinity' as any,
              height: 'NaN' as any
            });
          `,
        },
      ],
    })

    expect(result.diagnostics.length).toBeGreaterThanOrEqual(4)
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.some(m => m.includes('01'))).toBe(true)
    expect(messages.some(m => m.includes('0x10'))).toBe(true)
    expect(messages.some(m => m.includes('Infinity'))).toBe(true)
    expect(messages.some(m => m.includes('NaN'))).toBe(true)
  })
})
