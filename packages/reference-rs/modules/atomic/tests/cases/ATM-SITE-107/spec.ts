/**
 * Linked workspace packages (ATM-SITE-107). `@acme/icons` and `@acme/panel` are
 * both linked into `node_modules`, outside the compile sources, and from both the
 * project's generated runtime resolves. Only `@acme/panel` imports it: its `bg`
 * backs under own. `@acme/icons` is not built on Reference UI, so its `color` and
 * `size` mint no want, no class and no diagnostic, standalone or with lib composed.
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

const CASE = 'ATM-SITE-107'
const OWN = {
  'bg:blue': '@reference-ui/lib__bg_blue',
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

/** Each site want as `<prop>:<value> <backing>`, sorted. */
function wantRows(result: CompileResult): string[] {
  return siteWants(result)
    .map(w => {
      const value = Object.values(w.value as Record<string, string>)[0]
      return `${w.prop}:${value} ${w.backing === undefined ? 'own' : w.backing.join('+')}`
    })
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
    expect(wantRows(result)).toEqual(['bg:blue own', 'p:1r own'])
    expect(result.css?.classes).toEqual(OWN)
    expect(result.diagnostics).toEqual([])

    const withLib = await compileWithLib()
    expect(wantRows(withLib)).toEqual(['bg:blue own', 'p:1r own'])
    expect(planRows(withLib)).toEqual([
      '@reference-ui/lib bg:blue @reference-ui/lib__bg_blue',
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
    ])
    expect(withLib.diagnostics).toEqual([])
  },
}

export default spec
