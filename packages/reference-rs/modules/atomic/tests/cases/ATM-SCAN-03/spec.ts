/**
 * Loop-closing alias case (ATM-SCAN-03). `input/` holds `src/x.ts` (red.500) and `src/a/y.ts` (blue.500), and the default
 * compile reads both. This spec copies `input/` into a temp project it owns, adds the loop link `src/a/up -> ..`, and compiles
 * that project with an include that admits `src/a` only. `src/x.ts` is outside the include by its real path, so its one
 * in-scope path is `src/a/up/x.ts`: the red utility must compile from that alias, and its want must carry the alias path.
 * A walk that cut every link back to a directory on its path would lose red.500. The parent removes the temp project.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  hasWant,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../harness/helpers.js'

const CASE = 'ATM-SCAN-03'
const RED = 'red.500'
const BLUE = 'blue.500'
const INCLUDE = ['src/a/**/*.ts']

function frozenBase(sourceRoot: string): NativeCompileRequest {
  return {
    schemaVersion: 2,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: [],
    sourceRoot,
    declarationRoot: sourceRoot,
    logs: ['proof'],
  }
}

/** The file path of the color want that carries `value`, or undefined when no such want exists. */
function fileOfColor(result: CompileResult, value: string): string | undefined {
  const want = (result.wants ?? []).find(
    w => w.prop === 'color' && (w.value as Record<string, string> | undefined)?.String === value
  )
  return want?.file
}

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    expect(hasWant(result, 'color', RED)).toBe(true)
    expect(hasWant(result, 'color', BLUE)).toBe(true)

    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'atm-scan-03-'))
    try {
      fs.cpSync(path.resolve(getCaseInputDir(CASE)), root, { recursive: true })
      fs.symlinkSync('..', path.join(root, 'src', 'a', 'up'))

      const scoped = await compile({ ...frozenBase(root), include: INCLUDE })
      expect(scoped.diagnostics.filter(d => d.severity === 'error')).toEqual([])
      expect(hasWant(scoped, 'color', BLUE)).toBe(true)
      expect(hasWant(scoped, 'color', RED)).toBe(true)
      expect(fileOfColor(scoped, BLUE)).toMatch(/\/src\/a\/y\.ts$/)
      expect(fileOfColor(scoped, RED)).toMatch(/\/src\/a\/up\/x\.ts$/)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  },
}

export default spec
