// Guard for the `!src/index.ts` negation in the lib ui.config.ts.
// It takes the live lib tree as data, compiles it with and without the barrel
// through the real scan→bundle→evaluate→compile path, and fails unless every
// artifact field is identical. The barrel holds no style call-sites, so the
// negation is a pure win; if a call-site ever lands there, the without-barrel
// compile silently drops it and this test catches the drift. Keep in sync with
// the comment at the negation.
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadUserConfig } from '../config/load.ts'
import type { ReferenceUIConfig } from '../config/types.ts'
import {
  evaluatePreparedFragments,
  prepareFragments,
  scanFragmentFilesNative,
} from '../collect/lib/evaluate.ts'
import { PRIMITIVE_JSX_NAMES } from '../primitives/tags.ts'
import { resolveJsxElements } from './jsx-elements.ts'
import {
  compileNative,
  releaseRetention,
  type ScopedCompileRequest,
} from './native.ts'
import { applyNormalizeCss } from './reset.ts'

// The lib tree is data, never a dependency: this test reads its config and
// sources from disk the way NEO-PARITY-03 censuses them. Absolute by
// construction — a relative project dir silently degrades sync (LOG-3.md).
const LIB_DIR = fileURLToPath(new URL('../../../reference-lib', import.meta.url))
const BARREL_NEGATION = '!src/index.ts'

interface CompileFingerprint {
  retained: number
  fragmentMatches: string[]
  cssBytes: number
  cssSha: string
  portableBytes: number
  portableSha: string
  tracedHosts: string[]
  diagnosticCount: number
  compilerDiagnosticCount: number
  errorCount: number
}

function sha12(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 12)
}

function uniqueSorted(names: readonly string[]): string[] {
  return [...new Set(names)].sort()
}

// One full scan→bundle→evaluate→compile leg for an include set, mirroring
// sync(). The counting scan is spare (prepare rescans for the live token),
// so its retention is released instead of drained.
async function fingerprintInclude(config: ReferenceUIConfig, include: string[]): Promise<CompileFingerprint> {
  const variant = { ...config, include }
  const counted = await scanFragmentFilesNative(LIB_DIR, variant)
  if (counted.retention.token !== undefined) await releaseRetention(counted.retention.token)

  const prepared = await prepareFragments(LIB_DIR, variant)
  const spec = await evaluatePreparedFragments(LIB_DIR, variant, prepared)
  applyNormalizeCss(spec, variant.normalizeCss)
  const requested = resolveJsxElements(variant)
  const request: ScopedCompileRequest = {
    schemaVersion: 1,
    spec,
    jsxHosts: uniqueSorted([...requested.merged, ...PRIMITIVE_JSX_NAMES]),
    sourceRoot: LIB_DIR,
    declarationRoot: LIB_DIR,
    include,
    logs: variant.logs,
    retentionToken: prepared.retentionToken,
  }
  const result = await compileNative(request)

  return {
    retained: counted.retention.count,
    fragmentMatches: uniqueSorted(counted.matches),
    cssBytes: result.stylesheet.length,
    cssSha: sha12(result.stylesheet),
    portableBytes: (result.portableStylesheet ?? '').length,
    portableSha: sha12(result.portableStylesheet ?? ''),
    tracedHosts: uniqueSorted(result.tracedJsxHosts ?? []),
    diagnosticCount: result.diagnostics.length,
    compilerDiagnosticCount: (result.compilerDiagnostics ?? []).length,
    errorCount: result.diagnostics.filter(entry => entry.severity === 'error').length,
  }
}

describe('lib barrel negation', () => {
  it('keeps sync output identical with and without src/index.ts', { timeout: 120_000 }, async () => {
    const config = await loadUserConfig(LIB_DIR)
    const negations = config.include.filter(pattern => pattern === BARREL_NEGATION)
    // The guard is vacuous without the negation: fail rather than pass on
    // an identical-variants comparison nobody asked for.
    expect(negations).toHaveLength(1)

    const withoutBarrel = config.include
    const withBarrel = config.include.filter(pattern => pattern !== BARREL_NEGATION)
    const excluded = await fingerprintInclude(config, withoutBarrel)
    const included = await fingerprintInclude(config, withBarrel)

    expect(included.errorCount).toBe(0)
    expect(excluded.errorCount).toBe(0)
    // The negation matches exactly the barrel: nothing more, nothing silently less.
    expect(included.retained - excluded.retained).toBe(1)
    expect(excluded.fragmentMatches).toEqual(included.fragmentMatches)
    expect({ bytes: excluded.cssBytes, sha: excluded.cssSha }).toEqual({
      bytes: included.cssBytes,
      sha: included.cssSha,
    })
    expect({ bytes: excluded.portableBytes, sha: excluded.portableSha }).toEqual({
      bytes: included.portableBytes,
      sha: included.portableSha,
    })
    expect(excluded.tracedHosts).toEqual(included.tracedHosts)
    expect(excluded.diagnosticCount).toBe(included.diagnosticCount)
    expect(excluded.compilerDiagnosticCount).toBe(included.compilerDiagnosticCount)
  })
})
