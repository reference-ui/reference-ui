/**
 * First sync of a runtime-borrowing workspace package (ATM-SITE-106). `@acme/panel`
 * resolves to its built `dist`, which imports `@reference-ui/react`, and publishes
 * no system; this project's runtime is not generated yet. The committed tree links
 * `node_modules/@reference-ui/react` to the missing `.reference-ui/react`; the twin
 * has no link at all. Both are where this sync puts its runtime, so `Panel` is own:
 * `bg` backs `@reference-ui/lib__bg_red`, alone or with lib composed, silently.
 */
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import { createVirtualWorkspace } from '../../../../../testing/index.js'
import {
  getCaseInputDir,
  layerClassNames,
  LIB_SYSTEM_SPEC,
  wantBackings,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SITE-106'
const OWN = {
  'bg:red': '@reference-ui/lib__bg_red',
  'p:1r': '@reference-ui/lib__p_1r',
}

/** Core's request over `root`: the primitive roster, with lib composed. */
function compileWithLib(root: string): Promise<CompileResult> {
  const sourceRoot = path.resolve(root)
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

/** The case tree as a fresh checkout leaves it: no `@reference-ui` scope in node_modules. */
async function withoutRuntimeLink<T>(run: (root: string) => Promise<T>): Promise<T> {
  const workspace = await createVirtualWorkspace({}, CASE)
  try {
    fs.cpSync(getCaseInputDir(CASE), workspace.rootDir, { recursive: true, verbatimSymlinks: true })
    fs.rmSync(path.join(workspace.rootDir, 'node_modules', '@reference-ui'), { recursive: true })
    return await run(workspace.rootDir)
  } finally {
    await workspace.cleanup()
  }
}

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    const input = getCaseInputDir(CASE)
    expect(fs.existsSync(path.join(input, '.reference-ui'))).toBe(false)
    expect(fs.lstatSync(path.join(input, 'node_modules/@reference-ui/react')).isSymbolicLink()).toBe(true)

    expect(wantBackings(result, 'bg')).toEqual(['red own'])
    expect(result.css?.classes).toEqual(OWN)
    expect(result.diagnostics).toEqual([])

    await withoutRuntimeLink(async root => {
      const fresh = await compileWithLib(root)
      expect(wantBackings(fresh, 'bg')).toEqual(['red own'])
      expect(fresh.css?.classes).toEqual(OWN)
      expect(layerClassNames(fresh.stylesheet, 'utilities').has('reference-ui__bg_red')).toBe(false)
      expect(fresh.diagnostics).toEqual([])
    })
  },
}

export default spec
