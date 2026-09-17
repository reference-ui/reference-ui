/**
 * Frozen request parity station. The frozen NativeCompileRequest shape must
 * compile the same sources to byte-identical artifacts as the legacy shape,
 * while jsxHosts admits a configured host that file-local imports do not list.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  hasWant,
  LAYER_PREAMBLE,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
} from '../../helpers.js'

const CASE = 'ATM-SEAM-02'

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'mt', '4r')).toBe(false)

    const sourceRoot = path.resolve(getCaseInputDir(CASE))
    const frozenBase = {
      schemaVersion: 1 as const,
      spec: LIB_SYSTEM_SPEC,
      jsxHosts: [] as string[],
      sourceRoot,
      declarationRoot: sourceRoot,
    }
    const frozen = await compile(frozenBase)
    expect(frozen.stylesheet).toBe(result.stylesheet)
    expect(frozen.css?.classes).toEqual(result.css?.classes ?? {})
    expect(frozen.diagnostics).toEqual(result.diagnostics)
    expect(frozen.atomCount).toBe(result.atomCount)

    const hosted = await compile({ ...frozenBase, jsxHosts: ['ConfiguredHost'] })
    expect(hasWant(hosted, 'mt', '4r')).toBe(true)
    expect(hosted.stylesheet).toContain('mt_4r')
    expect(result.stylesheet).not.toContain('mt_4r')

    const badVersion = await compile({
      ...frozenBase,
      schemaVersion: 2,
    } as unknown as NativeCompileRequest)
    expect(badVersion.diagnostics).toHaveLength(1)
    expect(badVersion.diagnostics[0]!.severity).toBe('error')
    expect(badVersion.diagnostics[0]!.message).toContain('schemaVersion')
    expect(badVersion.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
    expect(badVersion.atomCount).toBe(0)
  },
}

export default spec
