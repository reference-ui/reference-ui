/**
 * `css` wrapper around a package tag (ATM-SITE-98). `Wrap` forwards its `css`
 * into lib's `Button`, so the call-site `css` is an external want that backs
 * `upstream__c_blue` under one composed upstream, with no own class and no
 * `ATM-W-MISSING-STYLE-PLAN` for `color`. `OwnWrap` forwards into Reference's
 * `Div`, so its call-site `css` stays own. The threading pre-pass and the JSX
 * walk share one verdict, with or without the primitive roster.
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

const CASE = 'ATM-SITE-98'
const OWN_BG = { 'bg:red': '@reference-ui/lib__bg_red' }

/** Core's request: the primitive roster names `Button`, one upstream is composed. */
function compileComposed(): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Button'],
    upstreamSystems: ['upstream'],
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
    expect(verdicts(result, 'color')).toEqual(['blue external'])
    expect(verdicts(result, 'bg')).toEqual(['red own'])
    expect(result.css?.classes).toEqual(OWN_BG)

    const composed = await compileComposed()
    expect(verdicts(composed, 'color')).toEqual(['blue external'])
    expect(verdicts(composed, 'bg')).toEqual(['red own'])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib bg:red @reference-ui/lib__bg_red',
      'upstream color:blue upstream__c_blue',
    ])
    expect(composed.css?.classes).toEqual(OWN_BG)
    const painted = layerClassNames(composed.stylesheet, 'utilities')
    expect(painted.has('upstream__c_blue')).toBe(true)
    expect(painted.has('@reference-ui/lib__c_blue')).toBe(false)
    // The claim is the package wrapper's `color`; the own wrapper's threaded
    // `bg` is outside it.
    const misses = composed.diagnostics.filter(d => d.code === 'ATM-W-MISSING-STYLE-PLAN')
    expect(misses.filter(d => d.message.includes('`color'))).toEqual([])
    expect(composed.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  },
}

export default spec
