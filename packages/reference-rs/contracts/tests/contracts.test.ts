/**
 * Contract verification suite for Reference RS packet F0 frozen wire fixtures.
 * Asserts that committed JSON fixtures satisfy TypeScript interfaces for all §3 boundaries.
 * Validates positive invariants (schemaVersion === 1, profile === 'reference-ui', owner on plans)
 * and verifies negative fixtures (unsupported versions, unknown fields, layers hosts).
 */

import { describe, expect, it } from 'vitest'
import compileResultJson from '../fixtures/compile-result.json' with { type: 'json' }
import evaluatedSystemSpecInvalidVersionJson from '../fixtures/evaluated-system-spec-invalid-version.json' with { type: 'json' }
import evaluatedSystemSpecTokenLightJson from '../fixtures/evaluated-system-spec-token-light.json' with { type: 'json' }
import evaluatedSystemSpecUnknownFieldJson from '../fixtures/evaluated-system-spec-unknown-field.json' with { type: 'json' }
import evaluatedSystemSpecJson from '../fixtures/evaluated-system-spec.json' with { type: 'json' }
import inventoryJson from '../fixtures/inventory.json' with { type: 'json' }
import nativeCompileRequestLayersNegativeJson from '../fixtures/native-compile-request-layers-negative.json' with { type: 'json' }
import nativeCompileRequestJson from '../fixtures/native-compile-request.json' with { type: 'json' }
import nativeRuntimeArtifactJson from '../fixtures/native-runtime-artifact.json' with { type: 'json' }
import portableBaseSystemJson from '../fixtures/portable-base-system.json' with { type: 'json' }

import type {
  CompileResult,
  EvaluatedSystemSpec,
  NativeCompileRequest,
  NativeRuntimeArtifact,
  OutputInventory,
  PortableBaseSystem,
} from '../types'

describe('F0: Frozen wire contract fixtures', () => {
  it('EvaluatedSystemSpec fixture satisfies interface and contains required §3.1 fields', () => {
    const spec = evaluatedSystemSpecJson satisfies EvaluatedSystemSpec
    expect(spec.schemaVersion).toBe(1)
    expect(spec.profile).toBe('reference-ui')
    expect(spec.name).toBe('lib-test-system')
    expect(spec.tokens).toBeDefined()
    expect(spec.fonts).toBeDefined()
    expect(spec.globalCss.length).toBeGreaterThan(0)
    expect(spec.staticCss).toBeDefined()
    expect(spec.staticCss.color).toContain('*')
    expect(spec.staticCss.padding).toContain('*')
    expect(spec.staticCss.borderRadius).toContain('*')
    expect(spec.provenance.length).toBeGreaterThan(0)

    // Check container: true and responsive array with null hole in globalCss
    const rules = spec.globalCss[0].rules
    expect(rules['.container']).toEqual({ container: true })
    expect(rules['.responsive-box']).toEqual({ padding: ['1', null, '4'] })
  })

  it('Token-light EvaluatedSystemSpec fixture satisfies interface without colors/spacing', () => {
    const spec = evaluatedSystemSpecTokenLightJson satisfies EvaluatedSystemSpec
    expect(spec.schemaVersion).toBe(1)
    expect((spec.tokens as Record<string, unknown>).colors).toBeUndefined()
    expect((spec.tokens as Record<string, unknown>).spacing).toBeUndefined()
  })

  it('EvaluatedSystemSpec accepts an optional extends chain (RS-4 BAS-EXTEND-*)', () => {
    const spec = {
      ...evaluatedSystemSpecJson,
      extends: ['upstream-system'],
    } satisfies EvaluatedSystemSpec
    expect(spec.extends).toEqual(['upstream-system'])
    expect({ ...spec, extends: undefined }).toBeDefined()
  })

  it('Invalid version fixture has schemaVersion !== 1', () => {
    expect(evaluatedSystemSpecInvalidVersionJson.schemaVersion).not.toBe(1)
  })

  it('Unknown field fixture contains unexpected property', () => {
    expect(
      (evaluatedSystemSpecUnknownFieldJson as Record<string, unknown>).unexpectedProperty
    ).toBe('should-fail-closed')
  })

  it('NativeRuntimeArtifact fixture satisfies interface and enforces system on plans', () => {
    const runtime = nativeRuntimeArtifactJson satisfies NativeRuntimeArtifact
    expect(runtime.schemaVersion).toBe(1)
    expect(runtime.stylePlans.length).toBeGreaterThan(0)

    // Every plan must carry an explicit system identity
    for (const plan of runtime.stylePlans) {
      expect(typeof plan.system).toBe('string')
      expect(plan.system.length).toBeGreaterThan(0)
      expect(Array.isArray(plan.when)).toBe(true)
      expect(typeof plan.prop).toBe('string')
      expect(Array.isArray(plan.declarations)).toBe(true)
    }

    // Must include plans from two distinct systems (lib-test-system and other-system)
    const systems = new Set(runtime.stylePlans.map((p) => p.system))
    expect(systems.has('lib-test-system')).toBe(true)
    expect(systems.has('other-system')).toBe(true)

    // Recipe runtime table has qualified identity ${system}__${className}
    expect(runtime.recipes['lib-test-system__button']).toBeDefined()
    expect(runtime.recipes['lib-test-system__button'].className).toBe('button')
    expect(runtime.recipes['lib-test-system__button'].qualifiedName).toBe('lib-test-system__button')

    // stylePropNames excludes variant and colorMode
    expect(runtime.stylePropNames).not.toContain('variant')
    expect(runtime.stylePropNames).not.toContain('colorMode')
    expect(runtime.stylePropNames).toContain('color')
    expect(runtime.stylePropNames).toContain('p')
  })

  it('CompileResult fixture satisfies interface with both stylesheets', () => {
    const result = compileResultJson satisfies CompileResult
    expect(result.stylesheet).toContain('@layer')
    expect(result.portableStylesheet).toContain('[data-layer="lib-test-system"]')
    expect(result.runtime.schemaVersion).toBe(1)
  })

  it('CompileResult fixture pins discovered host names', () => {
    const result = compileResultJson satisfies CompileResult
    expect(result.tracedJsxHosts).toEqual(['Card'])
  })

  it('PortableBaseSystem fixture satisfies interface with hashed cssChunks', () => {
    const portable = portableBaseSystemJson satisfies PortableBaseSystem
    expect(portable.schemaVersion).toBe(1)
    expect(portable.name).toBe('lib-test-system')
    expect(portable.cssChunks.length).toBeGreaterThan(0)
    expect(portable.cssChunks[0].system).toBe('lib-test-system')
    expect(portable.cssChunks[0].hash).toBeDefined()
    expect(portable.runtime.schemaVersion).toBe(1)
    expect(portable.jsxElements).toContain('Box')
  })

  it('NativeCompileRequest fixture satisfies interface and includes jsxHosts', () => {
    const request = nativeCompileRequestJson satisfies NativeCompileRequest
    expect(request.schemaVersion).toBe(1)
    expect(request.spec.name).toBe('lib-test-system')
    expect(request.jsxHosts).toContain('ConfiguredHost')
    expect(request.jsxHosts).toContain('AdoptedExtendsHost')
    expect(request.sourceRoot).toBeDefined()
    expect(request.declarationRoot).toBeDefined()
    expect(request.include).toEqual(['**/*.{ts,tsx}'])
  })

  it('Negative compile request identifies illegal layers host', () => {
    expect(nativeCompileRequestLayersNegativeJson.jsxHosts).toContain('IllegalLayerHost')
  })

  it('Output inventory defines required and forbidden paths', () => {
    const inventory = inventoryJson satisfies OutputInventory
    expect(inventory.expectedPaths).toContain('.reference-ui/system/evaluated-system.json')
    expect(inventory.expectedPaths).toContain('.reference-ui/styled/styles.css')
    expect(inventory.forbiddenPaths).toContain('panda.config.ts')
    expect(inventory.forbiddenPaths).toContain('.reference-ui/styled/css')
  })
})
