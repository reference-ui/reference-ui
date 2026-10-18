/**
 * Unbacked external tags (ATM-SITE-100). With no upstream composed, each
 * package tag that carries style props gets one located
 * `ATM-W-EXTERNAL-UNBACKED` warning on the default channel, naming its package
 * and the `extends`/`layers` fix; a package tag with no style props is silent.
 * Composing one upstream backs every external want and the warnings go away.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  compileCase,
  getCaseInputDir,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-100'
const UNBACKED = 'ATM-W-EXTERNAL-UNBACKED'

/** Core's request with one upstream composed. */
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

/** Each unbacked warning as `<severity> <file>:<line>`. */
function unbackedSites(result: CompileResult): string[] {
  return result.diagnostics
    .filter(d => d.code === UNBACKED)
    .map(d => `${d.severity} ${path.basename(d.file ?? '')}:${d.line}`)
}

/** The message and help of the unbacked warning at `line`, as one text. */
function unbackedText(result: CompileResult, line: number): string {
  const hit = result.diagnostics.find(d => d.code === UNBACKED && d.line === line)
  return [hit?.message ?? '', ...(hit?.help ?? [])].join('\n')
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
    expect(unbackedSites(result)).toEqual(['warning App.tsx:13', 'warning App.tsx:14'])
    const lib = unbackedText(result, 13)
    expect(lib).toContain('@reference-ui/lib')
    expect(lib).toContain('extends')
    expect(lib).toContain('layers')
    const acme = unbackedText(result, 14)
    expect(acme).toContain('acme-ui')
    expect(acme).toContain('extends')
    expect(acme).toContain('layers')

    // Default channel: the slim request carries it without the compiler channel.
    const slim = await compileCase(CASE, { logs: [] })
    expect(unbackedSites(slim)).toEqual(unbackedSites(result))

    const composed = await compileComposed()
    expect(unbackedSites(composed)).toEqual([])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
      'upstream bg:red upstream__bg_red',
      'upstream color:blue upstream__c_blue',
      'upstream p:2r upstream__p_2r',
    ])
  },
}

export default spec
