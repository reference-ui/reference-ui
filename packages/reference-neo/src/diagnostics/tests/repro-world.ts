// Repro world harness: the minimal temp project plus the whole compiler.
// It takes file maps and emits real native compile results with no stubs
// between the fixture and the engine. Row suites and request tests share
// this module so every repro builds its world the same way sync does.
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach } from 'vitest'
import { evaluatePreparedFragments, prepareFragments } from '../../collect/index.ts'
import type { PreparedFragments } from '../../collect/index.ts'
import { loadUserConfig } from '../../config/load.ts'
import { compileNative } from '../../native/compile.ts'
import type { NativeCompileResult, ScopedCompileRequest } from '../../native/contract.ts'
import { ELEMENT_JSX_NAMES } from '../../native/element-vocabulary.ts'
import { buildCompileRequest } from '../../native/request.ts'
import { releaseScanRetention } from '../../native/retention.ts'
import { cleanDir } from '../../sync/clean.ts'
import { applyNormalizeCss } from '../../sync/reset.ts'
import { resolveJsxElements } from '../../system/base/jsx.ts'

const tempDirs: string[] = []

/** Remove every temp world this file created, after each test. */
export function useReproCleanup(): void {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map(dir => cleanDir(dir)))
  })
}

export async function writeProject(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-repro-'))
  tempDirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
  return dir
}

export function configFile(extra: string): string {
  return [
    "import { defineConfig } from '@reference-ui/neo'",
    '',
    'export default defineConfig({',
    "  name: 'repro-test',",
    "  include: ['theme/**/*.{ts,tsx}'],",
    extra,
    '})',
    '',
  ].join('\n')
}

export const TOKENS_FILE = [
  "import { tokens } from '@reference-ui/neo'",
  '',
  'tokens({',
  '  colors: {',
  "    brand: { value: '#7c3aed' },",
  '  },',
  '})',
  '',
].join('\n')

export function styleFile(statement: string): string {
  return ["import { css } from '@reference-ui/react'", '', statement, ''].join('\n')
}

// The whole compiler minus publish: fragments evaluate once, the scoped
// request builds exactly as sync builds it, and native compile runs for
// real. No retention attach — the engine falls back to the disk scan over
// the temp world — and the live retention releases in the finally.
export async function compileWorld(dir: string): Promise<NativeCompileResult> {
  const config = await loadUserConfig(dir)
  const prepared = await prepareFragments(dir, config)
  try {
    const spec = await evaluatePreparedFragments(dir, config, prepared)
    applyNormalizeCss(spec, config.normalizeCss)
    const requested = resolveJsxElements(config)
    const request = buildCompileRequest({
      spec,
      requested: requested.merged,
      primitiveNames: ELEMENT_JSX_NAMES,
      sourceRoot: dir,
      declarationRoot: dir,
      include: config.include,
      logs: config.logs,
    })
    return await compileNative(request)
  } finally {
    await releaseScanRetention(prepared.retentionToken)
  }
}

/** One row per code: fixture, channel, and the severity it must ride. */
export interface ReproRow {
  code: string
  severity: 'warning' | 'error'
  channel: 'diagnostics' | 'compilerDiagnostics'
  configExtra: string
  files: Record<string, string>
}

/** A built world plus its prepared fragments and mutable request. */
export interface CustomWorld {
  dir: string
  prepared: PreparedFragments
  request: ScopedCompileRequest
}

// Request-level repro setup: the world on disk plus the built request the
// test mutates before compiling (host roster, spec, retention). The caller
// compiles and releases, exactly like the conflicting-inputs precedent.
export async function prepareCustomWorld(
  files: Record<string, string>
): Promise<CustomWorld> {
  const dir = await writeProject({
    'ui.config.ts': configFile(''),
    'theme/tokens.ts': TOKENS_FILE,
    ...files,
  })
  const config = await loadUserConfig(dir)
  const prepared = await prepareFragments(dir, config)
  const spec = await evaluatePreparedFragments(dir, config, prepared)
  const requested = resolveJsxElements(config)
  const request = buildCompileRequest({
    spec,
    requested: requested.merged,
    primitiveNames: ELEMENT_JSX_NAMES,
    sourceRoot: dir,
    declarationRoot: dir,
    include: config.include,
    logs: config.logs,
  })
  return { dir, prepared, request }
}
