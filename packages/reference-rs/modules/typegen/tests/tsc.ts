/**
 * Shared tsc --noEmit harness for typegen consumer fixtures. Writes a temp
 * tsconfig plus a styles.d.ts and consumer.ts, then runs `pnpm exec tsc`.
 * Production `emit_dts` still returns a string and does not write the
 * filesystem. Tests pass the printed (or golden) declaration text in; this
 * helper only typechecks it. Shared expectTscOk and expectTscReject
 * assertions keep the TS2589-blindness pin and failure-code pins uniform
 * across consumer suites.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const goldensDir = join(testsDir, 'goldens')
const rsRoot = join(testsDir, '../../..')

export type TscProject = {
  dts: string
  source: string
}

export type TscResult = {
  status: number
  output: string
}

export function readGolden(name: string): string {
  return readFileSync(join(goldensDir, name), 'utf8')
}

export function compile(project: TscProject): TscResult {
  const dir = mkdtempSync(join(tmpdir(), 'typegen-tsc-'))
  try {
    writeFileSync(join(dir, 'styles.d.ts'), project.dts)
    writeFileSync(join(dir, 'consumer.ts'), project.source)
    writeFileSync(join(dir, 'tsconfig.json'), tsconfigJson())
    return invokeTsc(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function tsconfigJson(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        strict: true,
        noEmit: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        target: 'ES2022',
        lib: ['ES2022'],
        skipLibCheck: false,
      },
      include: ['./**/*.ts'],
    },
    null,
    2
  )}\n`
}

function invokeTsc(projectDir: string): TscResult {
  try {
    const output = execFileSync(
      'pnpm',
      ['exec', 'tsc', '--noEmit', '-p', join(projectDir, 'tsconfig.json')],
      { cwd: rsRoot, encoding: 'utf8' }
    )
    return { status: 0, output }
  } catch (error) {
    return tscFailure(error)
  }
}

function tscFailure(error: unknown): TscResult {
  if (!isStatusError(error)) {
    throw error
  }
  return {
    status: error.status ?? 1,
    output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
  }
}

export function expectTscOk(result: TscResult): void {
  expect(result.output, result.output).not.toContain('TS2589')
  expect(result.status, result.output).toBe(0)
}

export function expectTscReject(result: TscResult, code: RegExp): void {
  expect(result.status, result.output).not.toBe(0)
  expect(result.output).not.toContain('TS2589')
  expect(result.output).toMatch(code)
}

function isStatusError(
  error: unknown
): error is { status?: number | null; stdout?: string; stderr?: string } {
  return typeof error === 'object' && error !== null && 'status' in error
}
