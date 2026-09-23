// Sync: the module that regenerates the Neo generated folder.
// It takes a project root and emits a fresh folder from config plus fragments.
// Serial by construction: fragments, one native compile, publish. A function.

import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import {
  compileNative,
  releaseRetention,
  type NativeCompileResult,
  type NativeDiagnostic,
  type ScopedCompileRequest,
} from './native.ts'
import { loadUserConfig } from '../config/load.ts'
import { getOutDirPath } from '../lib/paths/index.ts'
import {
  createPortableFragmentBundle,
  evaluatePreparedFragments,
  prepareFragments,
} from '../fragments/index.ts'
import { resolveJsxElements } from './jsx-elements.ts'
import { applyNormalizeCss } from './reset.ts'
import { PRIMITIVE_JSX_NAMES } from '../primitives/tags.ts'
import { cleanDir } from './clean.ts'
import { linkGeneratedPackages, publishRuntimeBundle, publishSyncFolder, publishTypesBundle } from './publish.ts'
import { markPhase } from './phases.ts'
import { mergePackedStylesheets, type PackedUpstream } from './packed-css.ts'
import { publishReactBundle } from './react.ts'
import { publishReferenceTypesBundle } from './reference-types.ts'
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

function diagnosticLocation(entry: NativeDiagnostic): string {
  if (!entry.file) return ''
  if (entry.line === undefined) return ` (${entry.file})`
  if (entry.column === undefined) return ` (${entry.file}:${entry.line})`
  return ` (${entry.file}:${entry.line}:${entry.column})`
}

function throwOnErrorDiagnostics(diagnostics: NativeDiagnostic[]): void {
  const errors = diagnostics.filter(entry => entry.severity === 'error')
  if (errors.length === 0) return
  const lines = errors.map(entry => `- ${entry.message}${diagnosticLocation(entry)}`)
  throw new Error(`native compile failed:\n${lines.join('\n')}`)
}

// Warnings print LOUD on every sync and never throw: a drifting sync that
// stays green must still show what the engine disliked, and a failing sync
// must not take its warnings down with the throw. The stable code rides the
// line so censuses count by `rg -c`, not by reading prose.
function diagnosticCodeSuffix(entry: NativeDiagnostic): string {
  return entry.code === undefined ? '' : ` ${entry.code}`
}

function reportWarningDiagnostics(diagnostics: NativeDiagnostic[]): void {
  const warnings = diagnostics.filter(entry => entry.severity === 'warning')
  if (warnings.length === 0) return
  const lines = warnings.map(
    entry => `[neo] sync warning${diagnosticCodeSuffix(entry)}: ${entry.message}${diagnosticLocation(entry)}`
  )
  console.warn(lines.join('\n'))
}

// The compiler backchannel prints on its own console.warn call: every entry
// the engine returned (warnings AND infos — the channel is mostly info),
// one line each, so userspace keeps its single collapsed call untouched.
function reportCompilerDiagnostics(entries: NativeDiagnostic[] | undefined): void {
  if (!entries || entries.length === 0) return
  const lines = entries.map(
    entry => `[neo] compiler${diagnosticCodeSuffix(entry)}: ${entry.message}${diagnosticLocation(entry)}`
  )
  console.warn(lines.join('\n'))
}

function uniqueSorted(names: readonly string[]): string[] {
  return [...new Set(names)].sort()
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
      // C3-in-reverse: the token carries the retained bytes (the engine drains
      // them, then union-fills from disk only what the list misses); the TS
      // fallback carries `files`. Empty retention omits both (defense in
      // depth: native falls back to the disk scan).
      request = {
        schemaVersion: 1,
        spec,
        jsxHosts: uniqueSorted([...requested.merged, ...PRIMITIVE_JSX_NAMES]),
        sourceRoot: cwd,
        declarationRoot: cwd,
        include: config.include,
        logs: config.logs,
      }
      if (retentionToken !== undefined) request.retentionToken = retentionToken
      else if (prepared.scannedSources.length > 0) request.files = prepared.scannedSources
      markPhase('evalEnd')
      markPhase('compileStart')
      result = await compileNative(request)
      markPhase('compileEnd')
      // The drain consumed the retention: nothing left to release.
      retentionToken = undefined
      // RSS relief: scanned bytes are unreachable after compile; drop the refs
      // before publish so a mid-publish GC can reclaim the headroom.
      prepared.scannedSources = []
      prepared.retentionToken = undefined
      request.files = undefined
      request.retentionToken = undefined
    } finally {
      if (retentionToken !== undefined) {
        try {
          await releaseRetention(retentionToken)
        } catch {
          // Best-effort: never mask the in-flight error.
        }
      }
    }
    reportWarningDiagnostics(result.diagnostics)
    reportCompilerDiagnostics(result.compilerDiagnostics)
    throwOnErrorDiagnostics(result.diagnostics)

    // Publish carries configured ∪ traced: hosts the engine discovered
    // inside compile() join the config names in the artifact and the
    // portable system, so downstream extends keep their fuel.
    const jsx = resolveJsxElements(config, result.tracedJsxHosts ?? [])

    const merged = mergePublishedStylesheets(config.extends, result.stylesheet, result.portableStylesheet ?? '', spec.name)
    publishSyncFolder({
      outDir,
      spec,
      portableFragment: createPortableFragmentBundle(prepared),
      stylesheet: merged.stylesheet,
      portableStylesheet: merged.portableStylesheet,
      jsx,
    })
    // Logical request artifact: `files` (megabytes of bytes) and the
    // retention token (a live handle, never persisted) stay out of the
    // published JSON — undefined drops from serialization.
    writeFileSync(
      join(outDir, 'system', 'compile-request.json'),
      `${JSON.stringify({ ...request, files: undefined, retentionToken: undefined }, null, 2)}\n`,
      'utf-8'
    )
    await publishRuntimeBundle(outDir, spec.name, result.runtime)
    await publishReactBundle({
      outDir,
      systemName: spec.name,
      stylePropNames: result.runtime.stylePropNames,
    })
    await publishTypesBundle(outDir, spec)
    // After the react leg (its bundle is the alias target) and before the
    // links leg (the junction lands on a complete package).
    await publishReferenceTypesBundle({ outDir })
    linkGeneratedPackages(cwd, outDir)
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
