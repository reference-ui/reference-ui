/**
 * Package primitive name (ATM-SITE-96). `Button` imported from `acme-ui`
 * renders through that package's bundled runtime, under the system `acme` its
 * installed directory publishes, so the tag is not own even though Core's
 * primitive roster names `Button`. Composed beside lib, its `color` plans and
 * paints `acme__c_blue` only: no own class and no class under the other
 * composed system. Reference's own `Button` under the same roster name stays
 * own. The default compile (no roster, no upstream) composes nothing, so the
 * package want backs under no system.
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

const CASE = 'ATM-SITE-96'
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
    expect(wantBackings(result, 'color')).toEqual(['blue unbacked'])
    expect(wantBackings(result, 'bg')).toEqual(['red own'])
    expect(result.css?.classes).toEqual(OWN_BG)

    const composed = await compileComposed()
    expect(wantBackings(composed, 'color')).toEqual(['blue acme'])
    expect(wantBackings(composed, 'bg')).toEqual(['red own'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib bg:red @reference-ui/lib__bg_red',
      'acme color:blue acme__c_blue',
    ])
    expect(composed.css?.classes).toEqual(OWN_BG)
    const painted = layerClassNames(composed.stylesheet, 'utilities')
    expect(painted.has('acme__c_blue')).toBe(true)
    expect(painted.has('reference-ui__c_blue')).toBe(false)
    expect(painted.has('@reference-ui/lib__c_blue')).toBe(false)
    expect(composed.diagnostics).toEqual([])
  },
}

export default spec
