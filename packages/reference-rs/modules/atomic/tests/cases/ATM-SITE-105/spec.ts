/**
 * Untraced component tags (ATM-SITE-105). A project component the trace cannot
 * see through, a built workspace package borrowing the own runtime and an
 * unbound name nobody publishes all back under own, standalone and composed.
 * Core's request composes lib and `acme` and names `UpstreamCard` as published
 * by `acme`: that unbound tag backs `acme__p_2r` only, and nothing is backed
 * under `reference-ui`.
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

const CASE = 'ATM-SITE-105'
const OWN = {
  'bg:blue': '@reference-ui/lib__bg_blue',
  'bg:red': '@reference-ui/lib__bg_red',
  'color:green': '@reference-ui/lib__c_green',
  'p:1r': '@reference-ui/lib__p_1r',
  'p:2r': '@reference-ui/lib__p_2r',
}

/** Core's request: the primitive roster, lib and acme composed, acme's published name apart. */
function compileComposed(): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Div'],
    upstreamSystems: ['reference-ui', 'acme'],
    upstreamHosts: { acme: ['UpstreamCard'] },
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
    expect(result.tracedJsxHosts ?? []).toEqual([])
    expect(wantBackings(result, 'bg')).toEqual(['blue own', 'red own'])
    expect(wantBackings(result, 'p')).toEqual(['1r own', '2r own'])
    expect(wantBackings(result, 'color')).toEqual(['green own'])
    expect(result.css?.classes).toEqual(OWN)
    expect(result.diagnostics).toEqual([])

    const composed = await compileComposed()
    expect(wantBackings(composed, 'bg')).toEqual(['blue own', 'red own'])
    expect(wantBackings(composed, 'p')).toEqual(['1r own', '2r acme'])
    expect(wantBackings(composed, 'color')).toEqual(['green own'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib bg:blue @reference-ui/lib__bg_blue',
      '@reference-ui/lib bg:red @reference-ui/lib__bg_red',
      '@reference-ui/lib color:green @reference-ui/lib__c_green',
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
      'acme p:2r acme__p_2r',
    ])
    const painted = [...layerClassNames(composed.stylesheet, 'utilities')]
    expect(painted.filter(name => name.startsWith('reference-ui__'))).toEqual([])
    expect(painted).toContain('acme__p_2r')
    expect(composed.diagnostics).toEqual([])
  },
}

export default spec
