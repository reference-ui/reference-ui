/**
 * Unbacked package tags (ATM-SITE-100). With nothing composed, each package tag
 * that carries style props gets one located `ATM-W-EXTERNAL-UNBACKED` warning on
 * the default channel, naming its package, the system it renders through and the
 * `<package>/baseSystem` fix; a package tag with no style props is silent.
 * Composing lib only (gap 2) backs lib's `Button` under `reference-ui` and keeps
 * acme's warning, with acme's want backed under nothing rather than sprayed onto
 * lib; composing acme too backs it under `acme` and the warnings are gone.
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

/** Core's request with `upstreamSystems` composed. */
function compileComposed(upstreamSystems: string[]): Promise<CompileResult> {
  const sourceRoot = path.resolve(getCaseInputDir(CASE))
  const request: NativeCompileRequest & { upstreamSystems: string[] } = {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: ['Button'],
    upstreamSystems,
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
    expect(unbackedText(result, 13)).toBe(
      "style props on <Button> will not paint: '@reference-ui/lib' renders through its own " +
        "system 'reference-ui', and no system in `extends` or `layers` backs it\n" +
        "add '@reference-ui/lib/baseSystem' to `extends` or `layers` in ui.config"
    )
    expect(unbackedText(result, 14)).toBe(
      "style props on <AcmeCard> will not paint: 'acme-ui' renders through its own system " +
        "'acme', and no system in `extends` or `layers` backs it\n" +
        "add 'acme-ui/baseSystem' to `extends` or `layers` in ui.config"
    )

    // Default channel: the slim request carries it without the compiler channel.
    const slim = await compileCase(CASE, { logs: [] })
    expect(unbackedSites(slim)).toEqual(unbackedSites(result))

    // Gap 2: lib composed, acme not. Lib's tag is backed; acme's still warns,
    // and its `bg` plans under no system instead of lib's.
    const partial = await compileComposed(['reference-ui'])
    expect(unbackedSites(partial)).toEqual(['warning App.tsx:14'])
    expect(planRows(partial)).toEqual([
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
      'reference-ui color:blue reference-ui__c_blue',
      'reference-ui p:2r reference-ui__p_2r',
    ])

    const composed = await compileComposed(['reference-ui', 'acme'])
    expect(unbackedSites(composed)).toEqual([])
    expect(planRows(composed)).toEqual([
      '@reference-ui/lib p:1r @reference-ui/lib__p_1r',
      'acme bg:red acme__bg_red',
      'reference-ui color:blue reference-ui__c_blue',
      'reference-ui p:2r reference-ui__p_2r',
    ])
  },
}

export default spec
