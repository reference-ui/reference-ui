/**
 * Result-carries-discovery station (ATM-SEAM-05). compile() returns
 * tracedJsxHosts on both the legacy and frozen request shapes while the
 * request shape itself is unchanged (no discovery input).
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  hasWant,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
} from '../../helpers.js'

const CASE = 'ATM-SEAM-05'

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual(['Card'])
    expect(hasWant(result, 'mt', '4r')).toBe(true)

    const sourceRoot = path.resolve(getCaseInputDir(CASE))
    const frozen: NativeCompileRequest = {
      schemaVersion: 1,
      spec: LIB_SYSTEM_SPEC,
      jsxHosts: [],
      sourceRoot,
      declarationRoot: sourceRoot,
    }
    expect(Object.keys(frozen).sort()).toEqual([
      'declarationRoot',
      'jsxHosts',
      'schemaVersion',
      'sourceRoot',
      'spec',
    ])
    const viaFrozen = await compile(frozen)
    expect(viaFrozen.tracedJsxHosts ?? []).toEqual(['Card'])
    expect(viaFrozen.stylesheet).toBe(result.stylesheet)
    expect(viaFrozen.diagnostics).toEqual(result.diagnostics)

    const scoped = await compile({ ...frozen, include: ['src/**'] })
    expect(scoped.tracedJsxHosts ?? []).toEqual(['Card'])
    expect(scoped.stylesheet).toBe(result.stylesheet)
  },
}

export default spec
