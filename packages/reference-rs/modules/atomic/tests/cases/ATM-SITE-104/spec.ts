/**
 * Two-stream package (ATM-SITE-104). `@reference-ui/lib` publishes streams
 * `[reference-icons, reference-ui]`, so `<BoltIcon color="red" />` from it backs
 * one rule under each stream system the compile composes, in its own foreign
 * group, and none under `acme`, which is composed but renders nothing here.
 * With icons not composed it backs under `reference-ui` alone; the default
 * compile composes nothing and carries the unbacked warning.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  layerBody,
  layerClassNames,
  LIB_SYSTEM_SPEC,
  wantBackings,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-104'
const OWN = { 'p:1r': '@reference-ui/lib__p_1r' }

/** Core's request: the primitive roster, with `upstreamSystems` composed. */
function compileComposed(upstreamSystems: string[]): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Div'],
    upstreamSystems,
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
    expect(wantBackings(result, 'color')).toEqual(['red unbacked'])
    expect(result.css?.classes).toEqual(OWN)
    expect(result.diagnostics.map(d => `${d.code} ${path.basename(d.file ?? '')}:${d.line}`)).toEqual([
      'ATM-W-EXTERNAL-UNBACKED App.tsx:12',
    ])

    const composed = await compileComposed(['reference-icons', 'reference-ui', 'acme'])
    expect(wantBackings(composed, 'color')).toEqual(['red reference-icons+reference-ui'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
      'reference-icons color:red reference-icons__c_red',
      'reference-ui color:red reference-ui__c_red',
    ])
    expect(composed.css?.classes).toEqual(OWN)
    const painted = layerClassNames(composed.stylesheet, 'utilities')
    expect(painted.has('reference-icons__c_red')).toBe(true)
    expect(painted.has('reference-ui__c_red')).toBe(true)
    expect(painted.has('acme__c_red')).toBe(false)
    const utilities = layerBody(composed.stylesheet, 'utilities')
    expect(utilities).toContain('/* foreign reference-icons */')
    expect(utilities).toContain('/* foreign reference-ui */')
    expect(utilities).not.toContain('/* foreign acme */')
    expect(composed.diagnostics).toEqual([])

    const noIcons = await compileComposed(['reference-ui', 'acme'])
    expect(wantBackings(noIcons, 'color')).toEqual(['red reference-ui'])
    expect(planRows(noIcons)).toEqual([
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
      'reference-ui color:red reference-ui__c_red',
    ])
    expect(noIcons.diagnostics).toEqual([])
  },
}

export default spec
