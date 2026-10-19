/**
 * Barrel re-export (ATM-SITE-97). `./ui` re-exports lib's `Button`, `./own`
 * re-exports Reference's; the use sites import both by the same name through
 * relative paths. The package chain ends at the installed `@reference-ui/lib`,
 * whose published streams are `reference-icons` and `reference-ui`: composed
 * with `reference-ui` (and `acme` beside it) it backs `reference-ui__c_blue`
 * only, with no own class and nothing under `acme`; the own chain stays an own
 * host and backs `@reference-ui/lib__bg_red`. The traced own `Button` does not
 * pull the package's `Button` back to own, with or without the roster.
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

const CASE = 'ATM-SITE-97'
const OWN_BG = { 'bg:red': '@reference-ui/lib__bg_red' }

/** Core's request: the primitive roster names `Button`; lib and acme are composed. */
function compileComposed(): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Button'],
    upstreamSystems: ['reference-ui', 'acme'],
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
    expect(result.tracedJsxHosts ?? []).toEqual(['Button'])
    expect(wantBackings(result, 'color')).toEqual(['blue unbacked'])
    expect(wantBackings(result, 'bg')).toEqual(['red own'])
    expect(result.css?.classes).toEqual(OWN_BG)

    const composed = await compileComposed()
    expect(wantBackings(composed, 'color')).toEqual(['blue reference-ui'])
    expect(wantBackings(composed, 'bg')).toEqual(['red own'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib bg:red @reference-ui/lib__bg_red',
      'reference-ui color:blue reference-ui__c_blue',
    ])
    expect(composed.css?.classes).toEqual(OWN_BG)
    const painted = layerClassNames(composed.stylesheet, 'utilities')
    expect(painted.has('reference-ui__c_blue')).toBe(true)
    expect(painted.has('acme__c_blue')).toBe(false)
    expect(painted.has('@reference-ui/lib__c_blue')).toBe(false)
    expect(composed.diagnostics).toEqual([])
  },
}

export default spec
