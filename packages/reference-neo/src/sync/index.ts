// Sync: the module that regenerates the Neo generated folder.
// It takes a project root and emits a fresh folder from config plus fragments.
// Serial by construction: fragments, one native compile, publish. A function.

import { existsSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { compileNative } from '../native/compile.ts'
import type {
  NativeCompileResult,
  NativeDiagnostic,
  ScopedCompileRequest,
} from '../native/contract.ts'
import { reportSyncDiagnostics, throwOnErrorDiagnostics } from '../native/diagnostics.ts'
import { buildCompileRequest } from '../native/request.ts'
import {
  attachScanRetention,
  dropScanRetention,
  releaseScanRetention,
} from '../native/retention.ts'
import { loadUserConfig } from '../config/load.ts'
import { getOutDirPath, getOutDirTmpPath, getStageDirPath } from '../lib/paths/index.ts'
import {
  evaluatePreparedFragments,
  prepareFragments,
  type PreparedFragments,
} from '../collect/index.ts'
import { hasUpstreamContainerRoot } from '../system/base/container-root.ts'
import { createPortableFragmentBundle } from '../system/base/fragments.ts'
import { resolveJsxElements } from '../system/base/jsx.ts'
import { applyNormalizeCss } from './reset.ts'
import { ELEMENT_JSX_NAMES } from '../native/element-vocabulary.ts'
import { removeDirIfEmpty } from './clean.ts'
import { commitStagedDir } from './commit.ts'
import { getSyncLockDir, type SyncSessionKind } from './session-owner.ts'
import { acquireSyncSession } from './session.ts'
import { assembleSystem } from '../packager/assembly.ts'
import { linkGeneratedPackages } from '../packager/links.ts'
import { markPhase } from './phases.ts'
import { mergeStreams } from '../system/base/streams.ts'
import type { ReferenceUIConfig } from '../config/types.ts'
import {
  getReferenceManifestPath,
  getReferenceTastyBuild,
  getReferenceTastyDirPath,
  initReference,
  rebuildReferenceTastyBuild,
} from '../reference/bridge/index.ts'

export interface SyncResult {
  outDir: string
  spec: EvaluatedSystemSpec
  /** Userspace + compiler warnings reported: the one-liner folds this. */
  warningCount: number
  /** Userspace diagnostics as the engine reported them: `--json` prints these. */
  diagnostics: NativeDiagnostic[]
  /** Compiler backchannel entries (empty without the `logs` opt-in). */
  compilerDiagnostics: NativeDiagnostic[]
  /** Wall time for a watch sync in ms: the driver stamps the baseline and every resync alike, so the boot block and the one-liner both print the measured sync wall. */
  elapsedMs?: number
}

// REF-04 aftermath: sync used to rm-wipe the output dir, deleting the tasty
// artifacts the once-guard believes are landed. The staged commit preserves
// the tasty dir now, so the refresh only fires when the manifest never
// landed at all — cold worlds and killed runs. It rebuilds on the background
// loop, never awaited, so ref syncs keep running on their own; failures
// report and clear, so a later sync retries.
// The cold-start tasty build schedules onto the next loop iteration while
// sync completes unwatched. initReference returns void — nothing here
// awaits it, so the perf law holds by signature.
function scheduleReferenceTastyPhase(
  cwd: string,
  config: ReferenceUIConfig,
  reporting: { verbose: boolean; foldRefDiagnostics: boolean; json: boolean }
): void {
  initReference({ sourceDir: cwd, config }, { verbose: reporting.verbose, fold: reporting.foldRefDiagnostics, json: reporting.json })
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

export interface SyncOptions {
  sessionKind?: SyncSessionKind
  breakLock?: boolean
  /**
   * List every warning with its location and fix hint instead of folding
   * the count into the one-liner. Threaded from `ref sync --verbose`.
   */
  verbose?: boolean
  /**
   * Fold the reference tasty warning count into the caller's one-liner
   * instead of printing the summary. One-shot sync and the watch
   * runner set it (both drain the build and carry the count);
   * undrained library callers leave it unset so the background
   * landing keeps its standalone line.
   */
  foldRefDiagnostics?: boolean
  /**
   * Machine-readable run: the tasty phase routes its human lines to
   * stderr and reports its diagnostics as JSON. Threaded from
   * `ref sync --json`; sync itself prints nothing differently.
   */
  json?: boolean
}

interface CompiledSystem {
  spec: EvaluatedSystemSpec
  result: NativeCompileResult
  request: ScopedCompileRequest
}

// Evaluate-once plus the one native compile: fragments become the spec, the
// frozen request carries it across the cut, and the engine drains the live
// scan retention. The finally releases retention when eval or compile throws;
// the happy path clears it once the drain consumes it, so release never runs
// there.
async function evaluateAndCompile(
  cwd: string,
  config: ReferenceUIConfig,
  prepared: PreparedFragments
): Promise<CompiledSystem> {
  let retentionToken = prepared.retentionToken
  try {
    const spec = await evaluatePreparedFragments(cwd, config, prepared)
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
    const request = buildCompileRequest({
      spec,
      requested: requested.merged,
      primitiveNames: ELEMENT_JSX_NAMES,
      sourceRoot: cwd,
      declarationRoot: cwd,
      include: config.include,
      logs: config.logs,
      upstreamContainerRoot:
        hasUpstreamContainerRoot([...(config.extends ?? []), ...(config.layers ?? [])]) ||
        undefined,
    })
    attachScanRetention(request, prepared)
    markPhase('evalEnd')
    markPhase('compileStart')
    const result = await compileNative(request)
    markPhase('compileEnd')
    // The drain consumed the retention: nothing left to release.
    retentionToken = undefined
    dropScanRetention(request, prepared)
    return { spec, result, request }
  } finally {
    await releaseScanRetention(retentionToken)
  }
}

interface PublishInput {
  cwd: string
  config: ReferenceUIConfig
  stageDir: string
  outDir: string
  spec: EvaluatedSystemSpec
  prepared: PreparedFragments
  result: NativeCompileResult
  request: ScopedCompileRequest
}

// Assemble into the stage, then commit it live: the stage builds while the
// live folder keeps serving, and the commit flips it with no missing-file
// window before the scope links land on the complete folder.
async function assembleAndCommit(input: PublishInput): Promise<void> {
  // Publish carries configured ∪ traced: hosts the engine discovered
  // inside compile() join the config names in the artifact and the
  // portable system, so downstream extends keep their fuel.
  const jsx = resolveJsxElements(input.config, input.result.tracedJsxHosts ?? [])
  // Structured merge over data: both buckets feed the streams merge in
  // bucket order (extends, then layers), fragments stay extends-only.
  const merged = mergeStreams(
    [...(input.config.extends ?? []), ...(input.config.layers ?? [])],
    input.result.streams,
    input.spec.name
  )
  await assembleSystem({
    outDir: input.stageDir,
    spec: input.spec,
    portableFragment: createPortableFragmentBundle(
      input.prepared.upstreamFragments,
      input.prepared.localFragmentBundles.map(({ bundle }) => bundle)
    ),
    stylesheet: merged.stylesheet,
    portableStylesheet: merged.portableStylesheet,
    streams: merged.streams,
    jsx,
    runtime: input.result.runtime,
  })
  // Logical request artifact: `files` (megabytes of bytes) and the
  // retention token (a live handle, never persisted) stay out of the
  // published JSON — undefined drops from serialization. A sync
  // diagnostic, not packaging: it lands beside the assembled system.
  writeFileSync(
    join(input.stageDir, 'system', 'compile-request.json'),
    `${JSON.stringify({ ...input.request, files: undefined, retentionToken: undefined }, null, 2)}\n`,
    'utf-8'
  )
  // The commit moves the assembled stage live with no missing-file window,
  // then the links land on the complete folder.
  commitStagedDir(input.stageDir, input.outDir, {
    preserve: [getSyncLockDir(input.cwd), getReferenceTastyDirPath(input.cwd)],
  })
  linkGeneratedPackages(input.cwd, input.outDir)
  markPhase('publishEnd')
}

// The stage dies with the failed run while the live folder keeps its
// last-good outputs. Evaluator scratch drops too, so a fresh world still
// lands nothing at all (SYNC-11).
async function dropFailedStageAndScratch(stageDir: string, outDir: string): Promise<void> {
  try {
    await rm(stageDir, { recursive: true, force: true })
    await rm(getOutDirTmpPath(outDir), { recursive: true, force: true })
  } catch {
    // Best effort: the next sync drops the stranded stage at start, and
    // the commit prunes scratch it did not stage.
  }
}

/**
 * Regenerate the `.reference-ui/` folder for the project at cwd. Acquires
 * the session lock first, drops any stage a killed run stranded, then
 * evaluates fragments once, compiles the spec natively, and assembles the
 * result into the nested stage dir — the live folder keeps serving the
 * whole run. The commit then moves the stage live with no missing-file
 * window (identical bytes keep their mtime, the rest flips by atomic
 * rename, stale entries delete last), and the scope links land on the
 * complete folder. A failed sync keeps the last-good outputs: the stage
 * dies with the run, and a fresh world still lands nothing (SYNC-11). A
 * watch poke cover throws SyncCoveredByWatchError before any write. The
 * lock releases in the finally, before syncEnd.
 */
export async function sync(cwd: string, options: SyncOptions = {}): Promise<SyncResult> {
  markPhase('syncStart')
  const config = await loadUserConfig(cwd)
  markPhase('configEnd')
  const outDir = getOutDirPath(cwd)
  const stageDir = getStageDirPath(cwd)
  const session = await acquireSyncSession({
    cwd,
    kind: options.sessionKind ?? 'one-shot',
    breakLock: options.breakLock ?? false,
    json: options.json ?? false,
  })
  let failed = false

  try {
    // A killed run may have stranded its stage; it drops here, under the
    // lock, before anything assembles. The live folder stays untouched.
    await rm(stageDir, { recursive: true, force: true })
    markPhase('scanStart')
    const prepared = await prepareFragments(cwd, config)
    markPhase('scanEnd')
    const { spec, result, request } = await evaluateAndCompile(cwd, config, prepared)
    const warningCount = reportSyncDiagnostics(result.diagnostics, result.compilerDiagnostics, { verbose: options.verbose === true })
    throwOnErrorDiagnostics(result.diagnostics)

    await assembleAndCommit({ cwd, config, stageDir, outDir, spec, prepared, result, request })

    // Sync END only: schedule the background tasty phase, never await it.
    scheduleReferenceTastyPhase(cwd, config, {
      verbose: options.verbose === true,
      foldRefDiagnostics: options.foldRefDiagnostics === true,
      json: options.json === true,
    })

    return { outDir, spec, warningCount, diagnostics: result.diagnostics, compilerDiagnostics: result.compilerDiagnostics ?? [] }
  } catch (error) {
    failed = true
    await dropFailedStageAndScratch(stageDir, outDir)
    throw error
  } finally {
    session.release()
    if (failed) await removeDirIfEmpty(outDir)
    markPhase('syncEnd')
  }
}
