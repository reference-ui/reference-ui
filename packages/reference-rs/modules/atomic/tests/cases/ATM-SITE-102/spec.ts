/**
 * Runtime-borrowing workspace package (ATM-SITE-102). `@acme/panel` resolves to
 * its built `dist`, outside the compile sources, and publishes no system; its
 * `@reference-ui/react` resolves to this project's `.reference-ui/react`, so
 * the package renders through the own runtime and its binding is `Local`. The
 * trace admits `Panel` and `bg` backs under own, alone or with lib composed,
 * with nothing under `reference-ui` and no diagnostic.
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

const CASE = 'ATM-SITE-102'
const OWN = {
  'bg:red': '@reference-ui/lib__bg_red',
  'p:1r': '@reference-ui/lib__p_1r',
}

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

/** Each style plan as `<system> <prop>:<value> <classes>`, sorted. */
function planRows(result: CompileResult): string[] {
  return (result.stylePlans ?? [])
    .map(p => `${p.system} ${p.prop}:${String(p.value)} ${p.declarations.map(d => d.className).join(',')}`)
    .sort()
}

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    expect(result.tracedJsxHosts ?? []).toEqual(['Panel'])
    expect(wantBackings(result, 'bg')).toEqual(['red own'])
    expect(result.css?.classes).toEqual(OWN)
    expect(result.diagnostics).toEqual([])

    const withLib = await compileWithLib()
    expect(wantBackings(withLib, 'bg')).toEqual(['red own'])
    expect(planRows(withLib)).toEqual([
      '@reference-ui/lib bg:red @reference-ui/lib__bg_red',
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
    ])
    expect(layerClassNames(withLib.stylesheet, 'utilities').has('reference-ui__bg_red')).toBe(false)
    expect(withLib.diagnostics).toEqual([])
  },
}

export default spec
