/**
 * Include scoping station (RS-10). The frozen request's `include` globs scope
 * both the sourceRoot scan and the legacy virtual `files` list: a `css()` in
 * `outside/` yields no utility under `include: ['theme/**']`, while an absent
 * or empty include preserves the legacy scan-all behavior without new diagnostics.
 * A negation-only include (e.g. `['!outside/**']`) scopes to scan-all-minus-negatives.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile, type NativeCompileRequest } from '../../../js/index.js'
import {
  getCaseInputDir,
  hasWant,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
  type CompileResult,
} from '../../helpers.js'

const CASE = 'ATM-SCAN-01'
const RED = 'red.500'
const BLUE = 'blue.500'

function frozenBase(sourceRoot: string): NativeCompileRequest {
  return {
    schemaVersion: 1,
    spec: LIB_SYSTEM_SPEC,
    jsxHosts: [],
    sourceRoot,
    declarationRoot: sourceRoot,
    logs: ['proof'],
  }
}

function expectNoErrors(result: CompileResult): void {
  expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
}

function expectRedOnly(result: CompileResult): void {
  expect(hasWant(result, 'color', RED)).toBe(true)
  expect(hasWant(result, 'color', BLUE)).toBe(false)
  expect(result.css?.classes?.['color:red.500']).toBeDefined()
  expect(result.css?.classes?.['color:blue.500']).toBeUndefined()
}

function virtualFiles(sourceRoot: string) {
  const header = `import { css } from '@reference-ui/react'\n`
  return [
    {
      path: path.join(sourceRoot, 'theme', 'in.ts'),
      content: `${header}export const a = css({ color: '${RED}' })\n`,
    },
    {
      path: path.join(sourceRoot, 'outside', 'out.ts'),
      content: `${header}export const b = css({ color: '${BLUE}' })\n`,
    },
  ]
}

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    // Legacy golden base: without include the scan takes every file.
    expect(hasWant(result, 'color', RED)).toBe(true)
    expect(hasWant(result, 'color', BLUE)).toBe(true)

    const sourceRoot = path.resolve(getCaseInputDir(CASE))
    const base = frozenBase(sourceRoot)

    const scoped = await compile({ ...base, include: ['theme/**'] })
    expectNoErrors(scoped)
    expectRedOnly(scoped)

    const virtual = await compile({
      baseSystem: LIB_SYSTEM_SPEC,
      rootDir: sourceRoot,
      include: ['theme/**'],
      files: virtualFiles(sourceRoot),
      logs: ['proof'],
    })
    expectNoErrors(virtual)
    expectRedOnly(virtual)

    const open = await compile(base)
    expect(hasWant(open, 'color', BLUE)).toBe(true)
    const empty = await compile({ ...base, include: [] })
    expect(empty.stylesheet).toBe(open.stylesheet)
    expect(empty.css?.classes).toEqual(open.css?.classes ?? {})

    const negated = await compile({ ...base, include: ['**/*.ts', '!outside/**'] })
    expectNoErrors(negated)
    expectRedOnly(negated)

    const negationOnly = await compile({ ...base, include: ['!outside/**'] })
    expectNoErrors(negationOnly)
    expectRedOnly(negationOnly)

    const negationOnlyVirtual = await compile({
      baseSystem: LIB_SYSTEM_SPEC,
      rootDir: sourceRoot,
      include: ['!outside/**'],
      files: virtualFiles(sourceRoot),
      logs: ['proof'],
    })
    expectNoErrors(negationOnlyVirtual)
    expectRedOnly(negationOnlyVirtual)

    const missed = await compile({ ...base, include: ['nowhere/**'] })
    expectNoErrors(missed)
    expect(missed.wants ?? []).toEqual([])
    expect(missed.css?.classes ?? {}).toEqual({})
  },
}

export default spec
