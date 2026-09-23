// Sync: the module that regenerates the Neo generated folder.
// It takes a project root and emits a fresh folder from config plus fragments.
// Serial by construction: fragments, one native compile, publish. A function.

import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { compileNative } from '../native/compile.ts'
import type {
  NativeCompileResult,
  ScopedCompileRequest,
} from '../native/contract.ts'
import {
  reportCompilerDiagnostics,
  reportWarningDiagnostics,
  throwOnErrorDiagnostics,
} from '../native/diagnostics.ts'
import { buildCompileRequest } from '../native/request.ts'
import {
  attachScanRetention,
  dropScanRetention,
  releaseScanRetention,
} from '../native/retention.ts'
import { loadUserConfig } from '../config/load.ts'
import { getOutDirPath } from '../lib/paths/index.ts'
import {
  evaluatePreparedFragments,
  prepareFragments,
} from '../collect/index.ts'
import { createPortableFragmentBundle } from '../system/base/fragments.ts'
import { resolveJsxElements } from '../system/base/jsx.ts'
import { applyNormalizeCss } from './reset.ts'
import { PRIMITIVE_JSX_NAMES } from '../primitives/tags.ts'
import { cleanDir } from './clean.ts'
import { assembleSystem } from '../packager/assembly.ts'
import { markPhase } from './phases.ts'
import { mergePackedStylesheets, type PackedUpstream } from './packed-css.ts'
import type { ReferenceUIConfig } from '../config/types.ts'
import {
  getReferenceManifestPath,
  getReferenceTastyBuild,
  initReference,
  rebuildReferenceTastyBuild,
} from '../reference/bridge/index.ts'

export interface SyncResult {
  outDir: string
  spec: EvaluatedSystemSpec
}

// REF-04 trigger: every sync rm-wipes the output dir, so a warm-session
// re-sync (watch, tests, playground) deletes the tasty artifacts the
// once-guard believes are landed. When the session is warm but the manifest
// is gone from disk, rebuild it on the background loop — never awaited,
// so ref syncs keep running on their own. Failures report and clear, so a
// later sync retries.
// The cold-start tasty build schedules onto the next loop iteration while
// sync completes unwatched. initReference returns void — nothing here
// awaits it, so the perf law holds by signature — and the refresh only
// re-arms a warm session whose artifacts this run's wipe deleted (REF-04),
// also without awaiting.
function scheduleReferenceTastyPhase(cwd: string, config: ReferenceUIConfig): void {
  initReference({ sourceDir: cwd, config })
  refreshStaleReferenceTastyBuild(cwd, config)
}

function refreshStaleReferenceTastyBuild(sourceDir: string, config: ReferenceUIConfig): void {
  if (getReferenceTastyBuild(sourceDir) === undefined) return
  if (existsSync(getReferenceManifestPath(sourceDir))) return
  rebuildReferenceTastyBuild({ sourceDir, config }).then(
    () => undefined,
    (reason: unknown) => {
      const detail = reason instanceof Error ? reason.message : String(reason)
      console.error(`[neo] [ref] background tasty refresh failed: ${detail}`)
    }
  )
}

// Packed-css merge (both assemblies, one function): the served sheet takes
// upstream portable blocks plus the own :root-hoisted block; the published
// portable takes upstream portable blocks plus the own self-scoped block.
// Empty upstream css returns the own block byte-identical, so worlds without
// extends merge nothing.
function mergePublishedStylesheets(
  extendsSystems: readonly PackedUpstream[] | undefined,
  stylesheet: string,
  portableStylesheet: string,
  selfName: string
): { stylesheet: string; portableStylesheet: string } {
  const upstreams = extendsSystems ?? []
  return {
    stylesheet: mergePackedStylesheets(upstreams, stylesheet, selfName),
    portableStylesheet: mergePackedStylesheets(upstreams, portableStylesheet, selfName),
  }
}

/**
 * Regenerate the `.reference-ui/` folder for the project at cwd. Cleans the
 * stale folder first, evaluates fragments once, compiles the spec natively,
 * then publishes the minimal folder and links the generated packages. The
 * folder is atomic: any failure after the clean removes the output dir again,
 * so a failed sync never leaves a half-written folder behind (SYNC-11).
 */
export async function sync(cwd: string): Promise<SyncResult> {
  markPhase('syncStart')
  const config = await loadUserConfig(cwd)
  markPhase('configEnd')
  const outDir = getOutDirPath(cwd)
  await cleanDir(outDir)

  try {
    markPhase('scanStart')
    const prepared = await prepareFragments(cwd, config)
    markPhase('scanEnd')
    // Live retention between scan and compile-drain: the inner finally
    // releases it when eval or compile throws. The happy path clears the
    // local once the drain consumes it, so release never runs there.
    let retentionToken = prepared.retentionToken
    let spec: EvaluatedSystemSpec
    let result: NativeCompileResult
    let request: ScopedCompileRequest
    try {
      spec = await evaluatePreparedFragments(cwd, config, prepared)
      // LAYER-04: the reset fragment rides the spec only when normalizeCss is
      // not false; the engine prints reset-sourced fragments into @layer reset.
      applyNormalizeCss(spec, config.normalizeCss)

      // Frozen D12 request as evolved by RS-10: the engine scans sourceRoot
      // itself (no virtual mirror, no staged declarations — both roots are the
      // project), scoped to the config include globs, and admits the configured
      // hosts plus every generated primitive without an import. The request
      // records what the author asked for: discovery reaches the publish below,
      // never this list.
      const requested = resolveJsxElements(config)
      request = buildCompileRequest({
        spec,
        requested: requested.merged,
        primitiveNames: PRIMITIVE_JSX_NAMES,
        sourceRoot: cwd,
        declarationRoot: cwd,
        include: config.include,
        logs: config.logs,
      })
      attachScanRetention(request, prepared)
      markPhase('evalEnd')
      markPhase('compileStart')
      result = await compileNative(request)
      markPhase('compileEnd')
      // The drain consumed the retention: nothing left to release.
      retentionToken = undefined
      dropScanRetention(request, prepared)
    } finally {
      await releaseScanRetention(retentionToken)
    }
    reportWarningDiagnostics(result.diagnostics)
    reportCompilerDiagnostics(result.compilerDiagnostics)
    throwOnErrorDiagnostics(result.diagnostics)

    // Publish carries configured ∪ traced: hosts the engine discovered
    // inside compile() join the config names in the artifact and the
    // portable system, so downstream extends keep their fuel.
    const jsx = resolveJsxElements(config, result.tracedJsxHosts ?? [])

    const merged = mergePublishedStylesheets(config.extends, result.stylesheet, result.portableStylesheet ?? '', spec.name)
    await assembleSystem(cwd, {
      outDir,
      spec,
      portableFragment: createPortableFragmentBundle(
        prepared.upstreamFragments,
        prepared.localFragmentBundles.map(({ bundle }) => bundle)
      ),
      stylesheet: merged.stylesheet,
      portableStylesheet: merged.portableStylesheet,
      jsx,
      runtime: result.runtime,
    })
    // Logical request artifact: `files` (megabytes of bytes) and the
    // retention token (a live handle, never persisted) stay out of the
    // published JSON — undefined drops from serialization. A sync
    // diagnostic, not packaging: it lands beside the assembled system.
    writeFileSync(
      join(outDir, 'system', 'compile-request.json'),
      `${JSON.stringify({ ...request, files: undefined, retentionToken: undefined }, null, 2)}\n`,
      'utf-8'
    )
    markPhase('publishEnd')

    // Sync END only: schedule the background tasty phase, never await it.
    scheduleReferenceTastyPhase(cwd, config)

    return { outDir, spec }
  } catch (error) {
    await cleanDir(outDir)
    throw error
  } finally {
    markPhase('syncEnd')
  }
}
