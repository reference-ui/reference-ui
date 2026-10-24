// Sync: the module that regenerates the Core generated folder.
// It takes a project root in any spelling and emits a fresh folder from config plus fragments.
// Serial by construction: fragments, one native compile (compile-phase.ts), publish. A function.

import { writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import type {
  NativeCompileResult,
  NativeDiagnostic,
  ScopedCompileRequest,
} from '../native/contract.ts'
import { reportSyncDiagnostics, throwOnErrorDiagnostics } from '../native/diagnostics.ts'
import { loadUserConfigWithDependencies } from '../config/load.ts'
import { printConfigWarnings } from '../config/slow-evaluation.ts'
import { getOutDirPath, getOutDirTmpPath, getStageDirPath } from '../lib/paths/index.ts'
import { prepareFragments, type PreparedFragments } from '../collect/index.ts'
import { portableFragmentOf, publishedFragmentNodes } from '../system/base/fragments.ts'
import { resolveJsxElements } from '../system/base/jsx.ts'
import { removeDirIfEmpty } from './clean.ts'
import { commitStagedDir } from './commit.ts'
import { dropFailedStageAndScratch } from './failed-run.ts'
import { evaluateAndCompile } from './compile-phase.ts'
import { lockTakenByOther } from './owner-check.ts'
import { getSyncLockDir, type SyncSessionKind } from './session-owner.ts'
import { acquireSyncSession } from './session.ts'
import { assembleSystem } from '../packager/assembly.ts'
import { linkGeneratedPackages } from '../packager/links.ts'
import { markPhase } from './phases.ts'
import { mergeStreams } from '../system/base/streams.ts'
import type { ReferenceUIConfig } from '../config/types.ts'
import { getReferenceTastyDirPath } from '../reference/bridge/index.ts'
import { scheduleReferenceTastyPhase } from './tasty-phase.ts'

export interface SyncResult {
  outDir: string
  spec: EvaluatedSystemSpec
  /** Userspace + compiler warnings reported: the one-liner folds this. */
  warningCount: number
  /** Userspace diagnostics: the engine's compile warnings plus typegen's. `--json` prints these. */
  diagnostics: NativeDiagnostic[]
  /** Compiler backchannel entries (empty without the `logs` opt-in). */
  compilerDiagnostics: NativeDiagnostic[]
  /** Wall time for a watch sync in ms: the driver stamps the baseline and every resync alike, so the boot block and the one-liner both print the measured sync wall. */
  elapsedMs?: number
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

interface PublishInput {
  cwd: string
  config: ReferenceUIConfig
  stageDir: string
  outDir: string
  spec: EvaluatedSystemSpec
  prepared: PreparedFragments
  result: NativeCompileResult
  request: ScopedCompileRequest
  /** True once another session took the lock: the commit stops rather than write over it. */
  superseded: () => boolean
}

// Assemble into the stage, then commit it live: the stage builds while the
// live folder keeps serving, and the commit flips it with no missing-file
// window before the scope links land on the complete folder. Returns the
// typegen warnings the declaration leg raised, for the caller to report.
async function assembleAndCommit(input: PublishInput): Promise<NativeDiagnostic[]> {
  // Publish carries configured ∪ traced: hosts the engine discovered
  // inside compile() join the config names in the artifact and the
  // portable system, so downstream extends keep their fuel. The props
  // those hosts keep for themselves ride along the same way.
  const jsx = resolveJsxElements(
    input.config,
    input.result.tracedJsxHosts ?? [],
    input.result.tracedJsxOwned ?? {}
  )
  // Structured merge over data: both buckets feed the streams merge in
  // bucket order (extends, then layers), fragments stay extends-only.
  const merged = mergeStreams(
    [...(input.config.extends ?? []), ...(input.config.layers ?? [])],
    input.result.streams,
    input.spec.name
  )
  // The published node list: upstream nodes linearized, then the own node. The legacy
  // `fragment` string is the same nodes concatenated for readers that predate the list.
  const fragments = publishedFragmentNodes(
    input.prepared.upstreamFragments,
    input.spec.name,
    input.prepared.localFragmentBundles.map(({ bundle }) => bundle)
  )
  const typegenDiagnostics = await assembleSystem({
    outDir: input.stageDir,
    liveOutDir: input.outDir,
    spec: input.spec,
    portableFragment: portableFragmentOf(fragments),
    portableFragments: fragments,
    stylesheet: merged.stylesheet,
    portableStylesheet: merged.portableStylesheet,
    streams: merged.streams,
    jsx,
    runtime: input.result.runtime,
    strict: input.config.strict,
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
    scratch: getOutDirTmpPath(input.outDir),
    superseded: input.superseded,
  })
  linkGeneratedPackages(input.cwd, input.outDir)
  markPhase('publishEnd')
  return typegenDiagnostics
}

// One full turn of the event loop, with a poll phase in it. A stop signal that
// arrived during the synchronous commit is read from the signal pipe in that poll
// phase, so its handler runs while this run still holds the lock. An immediate
// queued from inside another waits for the next turn, which is what makes the
// second hop reach a poll phase; a single immediate can share the check phase
// with the work before it and resolve before the signal is read.
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(() => {
      setImmediate(resolve)
    })
  })
}

/**
 * Regenerate the `.reference-ui/` folder for the project at dir. Acquires
 * the session lock first, drops any stage a killed run stranded, then
 * evaluates fragments once, compiles the spec natively, and assembles the
 * result into the nested stage dir — the live folder keeps serving the
 * whole run. The commit then moves the stage live with no missing-file
 * window (identical bytes keep their mtime, the rest flips by atomic rename
 * over a backup, stale entries retire last), and the scope links land on the
 * complete folder. A failed sync rolls its changes back and keeps the
 * last-good outputs (CORE-SYNC-11 for a fresh world); a rollback that cannot restore
 * a file keeps that file's last-good bytes in a `sync.rollback-*` dir beside the
 * stage and names it in the error. A sync that lost the lock
 * mid-commit stops without touching what the new holder wrote. A watch poke
 * cover throws SyncCoveredByWatchError before any write. The lock releases in
 * the finally, after one event-loop turn that lets a queued stop signal land.
 */
export async function sync(dir: string, options: SyncOptions = {}): Promise<SyncResult> {
  // Resolved once, at the entry: the engine's include matcher strips the root by literal prefix, while
  // fast-glob returns normalized paths, so a `//` spelling would match nothing and drop every file.
  const cwd = resolve(dir)
  markPhase('syncStart')
  const loaded = await loadUserConfigWithDependencies(cwd)
  const config = loaded.config
  markPhase('configEnd')
  const outDir = getOutDirPath(cwd)
  const stageDir = getStageDirPath(cwd)
  const session = await acquireSyncSession({
    cwd,
    kind: options.sessionKind ?? 'one-shot',
    breakLock: options.breakLock ?? false,
    json: options.json ?? false,
  })
  const lockDir = getSyncLockDir(cwd)
  const superseded = (): boolean => lockTakenByOther(lockDir, session.owner.lockNonce)
  let failed = false

  try {
    // A killed run may have stranded its stage; it drops here, under the lock,
    // before anything assembles. The live folder stays untouched.
    await rm(stageDir, { recursive: true, force: true })
    markPhase('scanStart')
    const prepared = await prepareFragments(cwd, config)
    markPhase('scanEnd')
    const { spec, result, request } = await evaluateAndCompile(cwd, config, prepared)
    const reportOptions = { verbose: options.verbose === true }
    // The config's load-time warnings (a slow evaluation) join the compile warnings, and print
    // on their own line too: folded into the count alone, nobody would see them.
    const configDiagnostics = loaded.diagnostics ?? []
    const diagnostics = [...configDiagnostics, ...result.diagnostics]
    printConfigWarnings(configDiagnostics, options)
    const warningCount = reportSyncDiagnostics(diagnostics, result.compilerDiagnostics, reportOptions)
    throwOnErrorDiagnostics(diagnostics)

    const typegenDiagnostics = await assembleAndCommit({
      cwd,
      config,
      stageDir,
      outDir,
      spec,
      prepared,
      result,
      request,
      superseded,
    })
    // Typegen warnings exist only after assembly: they fold into the same
    // count and verbose list as the compile warnings.
    const typegenWarningCount = reportSyncDiagnostics(typegenDiagnostics, undefined, reportOptions)

    // Sync END only: schedule the background tasty phase, never await it.
    scheduleReferenceTastyPhase(cwd, config, {
      verbose: options.verbose === true,
      foldRefDiagnostics: options.foldRefDiagnostics === true,
      json: options.json === true,
    })

    return {
      outDir,
      spec,
      warningCount: warningCount + typegenWarningCount,
      diagnostics: [...diagnostics, ...typegenDiagnostics],
      compilerDiagnostics: result.compilerDiagnostics ?? [],
    }
  } catch (error) {
    failed = true
    await dropFailedStageAndScratch(stageDir, outDir, !superseded())
    throw error
  } finally {
    // The commit is synchronous, so a stop signal that landed during it is still queued here.
    await yieldToEventLoop()
    session.release()
    if (failed) await removeDirIfEmpty(outDir)
    markPhase('syncEnd')
  }
}
