/**
 * Published wrapper name (ATM-SITE-99). `AcmeCard` from `acme-ui` is the name
 * the package publishes, so Core's request carries it in `upstreamHosts`, apart
 * from the own roster; the consumer's own traced `AcmeCard` spells the same
 * name. The package tag renders through the installed package's system `acme`
 * and backs `acme__p_1r` only, with no own class and nothing under lib composed
 * beside it; the local wrapper stays own (`@reference-ui/lib__p_2r`) by tracing
 * alone, and the published name flips neither verdict.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  layerClassNames,
  LIB_SYSTEM_SPEC,
  wantBackings,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-99'
const OWN_P = { 'p:2r': '@reference-ui/lib__p_2r' }

/**
 * Core's request: the primitive roster in `jsxHosts`, lib and acme composed,
 * and the name acme publishes (`AcmeCard`) apart in `upstreamHosts`.
 */
function compileComposed(): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Div'],
    upstreamSystems: ['reference-ui', 'acme'],
    upstreamHosts: { acme: ['AcmeCard'] },
    sourceRoot,
    declarationRoot: sourceRoot,
    logs: ['proof'],
  }
  return compile(request)
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
    expect(wantBackings(result, 'p')).toEqual(['1r unbacked', '2r own'])
    expect(result.css?.classes).toEqual(OWN_P)

    const composed = await compileComposed()
    expect(wantBackings(composed, 'p')).toEqual(['1r acme', '2r own'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib p:2r @reference-ui/lib__p_2r',
      'acme p:1r acme__p_1r',
    ])
    expect(composed.css?.classes).toEqual(OWN_P)
    const painted = layerClassNames(composed.stylesheet, 'utilities')
    expect(painted.has('acme__p_1r')).toBe(true)
    expect(painted.has('reference-ui__p_1r')).toBe(false)
    expect(painted.has('@reference-ui/lib__p_1r')).toBe(false)
    expect(composed.diagnostics).toEqual([])
  },
}

export default spec
