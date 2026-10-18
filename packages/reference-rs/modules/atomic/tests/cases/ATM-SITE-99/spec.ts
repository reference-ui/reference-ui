/**
 * Published wrapper name (ATM-SITE-99). `AcmeCard` from `acme-ui` is the name
 * the package publishes, so Core's request carries it in `upstreamHosts`, apart
 * from the own roster; the consumer's own traced `AcmeCard` spells the same
 * name. The package tag is external and backs `upstream__p_1r` under one
 * composed upstream, with no own class; the local wrapper stays own
 * (`@reference-ui/lib__p_2r`) by tracing alone, and the published name flips
 * neither verdict.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  getWantsForProp,
  layerClassNames,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-99'
const OWN_P = { 'p:2r': '@reference-ui/lib__p_2r' }

/**
 * Core's request: the primitive roster in `jsxHosts`, one composed upstream,
 * and the name it publishes (`AcmeCard`) apart in `upstreamHosts`.
 */
function compileComposed(): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Div'],
    upstreamSystems: ['upstream'],
    upstreamHosts: { upstream: ['AcmeCard'] },
    sourceRoot,
    declarationRoot: sourceRoot,
    logs: ['proof'],
  }
  return compile(request)
}

/** Each want of `prop` as `<value> external|own`, sorted. */
function verdicts(result: CompileResult, prop: string): string[] {
  return getWantsForProp(result, prop)
    .map(w => `${(w.value as { String: string }).String} ${w.external ? 'external' : 'own'}`)
    .sort()
}

/** Each style plan as `<system> <prop>:<value> <classes>`, sorted. */
function planRows(result: CompileResult): string[] {
  return (result.stylePlans ?? [])
    .map(p => `${p.system} ${p.prop}:${String(p.value)} ${p.declarations.map(d => d.className).join(',')}`)
    .sort()
}

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual(['AcmeCard'])
    expect(verdicts(result, 'p')).toEqual(['1r external', '2r own'])
    expect(result.css?.classes).toEqual(OWN_P)

    const composed = await compileComposed()
    expect(verdicts(composed, 'p')).toEqual(['1r external', '2r own'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib p:2r @reference-ui/lib__p_2r',
      'upstream p:1r upstream__p_1r',
    ])
    expect(composed.css?.classes).toEqual(OWN_P)
    const painted = layerClassNames(composed.stylesheet, 'utilities')
    expect(painted.has('upstream__p_1r')).toBe(true)
    expect(painted.has('@reference-ui/lib__p_1r')).toBe(false)
    expect(composed.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  },
}

export default spec
