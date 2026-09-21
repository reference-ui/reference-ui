/**
 * Discovery scoping station (ATM-SCAN-02, twin of ATM-SCAN-01). The traced
 * entry set follows the frozen request's `include` globs: an outside-scope
 * wrapper is not a host even when rendered in scope, while an in-scope
 * wrapper importing it traces under its own name. Open include traces all.
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

const CASE = 'ATM-SCAN-02'

function frozenBase(sourceRoot: string): NativeCompileRequest {
  return {
    schemaVersion: 1,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: [],
    sourceRoot,
    declarationRoot: sourceRoot,
    logs: ['proof'],
  }
}

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual(['Card', 'Other', 'Wrapper'])
    expect(hasWant(result, 'mt', '4r')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(true)
    expect(hasWant(result, 'p', '1r')).toBe(true)

    const sourceRoot = path.resolve(getCaseInputDir(CASE))
    const scoped = await compile({ ...frozenBase(sourceRoot), include: ['inside/**'] })
    expect(scoped.tracedJsxHosts ?? []).toEqual(['Card', 'Wrapper'])
    expect(hasWant(scoped, 'mt', '4r')).toBe(true)
    expect(hasWant(scoped, 'mt', '2r')).toBe(true)
    expect(hasWant(scoped, 'p', '1r')).toBe(false)
    expect(scoped.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  },
}

export default spec
