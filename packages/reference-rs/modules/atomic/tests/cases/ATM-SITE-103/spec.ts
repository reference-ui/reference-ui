/**
 * Foreign package tags (ATM-SITE-103). `Heart` from the installed
 * `lucide-react` (no published system, no Reference runtime) and `Sparkline`
 * from the uninstalled `chart-kit` carry style-named props, yet neither is a
 * Reference component: no want, plan, class or diagnostic, standalone or with
 * lib composed. The own `Div` control's `p` is the only style that lowers.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  LIB_SYSTEM_SPEC,
  siteWants,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-103'
const OWN = { 'p:1r': '@reference-ui/lib__p_1r' }

/** Core's request: the primitive roster, with lib composed. */
function compileWithLib(): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Div'],
    upstreamSystems: ['reference-ui'],
    sourceRoot,
    declarationRoot: sourceRoot,
    logs: ['proof'],
  }
  return compile(request)
}

/** Each site want as `<prop>:<value>`, sorted. */
function wantRows(result: CompileResult): string[] {
  return siteWants(result)
    .map(w => `${w.prop}:${Object.values(w.value as Record<string, string>)[0]}`)
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
    expect(wantRows(result)).toEqual(['p:1r'])
    expect(result.css?.classes).toEqual(OWN)
    expect(result.diagnostics).toEqual([])

    const withLib = await compileWithLib()
    expect(wantRows(withLib)).toEqual(['p:1r'])
    expect(planRows(withLib)).toEqual(['@reference-ui/lib p:1r @reference-ui/lib__p_1r'])
    expect(withLib.css?.classes).toEqual(OWN)
    expect(withLib.diagnostics).toEqual([])
  },
}

export default spec
