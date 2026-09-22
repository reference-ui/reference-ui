// Sync: the module that regenerates the Neo generated folder.
// It takes a project root and emits a fresh folder from config plus fragments.
// Serial by construction: fragments, one native compile, publish. A function.

import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { compileNative, type NativeDiagnostic, type ScopedCompileRequest } from './native.ts'
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
import { linkGeneratedPackages, publishRuntimeBundle, publishSyncFolder, publishTypesBundle } from './publish.ts'
import { markPhase } from './phases.ts'
import { publishReactBundle } from './react.ts'

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
  rmSync(outDir, { recursive: true, force: true })

  try {
    markPhase('scanStart')
    const prepared = await prepareFragments(cwd, config)
    markPhase('scanEnd')
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
    // C3 single read: the fragment scan already holds every in-scope source,
    // so the engine skips its own scan+read and union-fills from disk only
    // what the list misses. Empty retention omits `files` (defense in depth:
    // native falls back to the disk scan).
    const request: ScopedCompileRequest = {
      schemaVersion: 1,
      spec,
      jsxHosts: uniqueSorted([...requested.merged, ...PRIMITIVE_JSX_NAMES]),
      sourceRoot: cwd,
      declarationRoot: cwd,
      include: config.include,
      logs: config.logs,
      ...(prepared.scannedSources.length > 0 ? { files: prepared.scannedSources } : {}),
    }
    markPhase('evalEnd')
    markPhase('compileStart')
    const result = await compileNative(request)
    markPhase('compileEnd')
    // RSS relief: scanned bytes are unreachable after compile; drop the refs
    // before publish so a mid-publish GC can reclaim the headroom.
    prepared.scannedSources = []
    request.files = undefined
    reportWarningDiagnostics(result.diagnostics)
    reportCompilerDiagnostics(result.compilerDiagnostics)
    throwOnErrorDiagnostics(result.diagnostics)

    // Publish carries configured ∪ traced: hosts the engine discovered
    // inside compile() join the config names in the artifact and the
    // portable system, so downstream extends keep their fuel.
    const jsx = resolveJsxElements(config, result.tracedJsxHosts ?? [])

    publishSyncFolder({
      outDir,
      spec,
      portableFragment: createPortableFragmentBundle(prepared),
      stylesheet: result.stylesheet,
      portableStylesheet: result.portableStylesheet ?? '',
      jsx,
    })
    // Logical request artifact: `files` (megabytes of bytes) stays out of
    // the published JSON — undefined drops from serialization.
    writeFileSync(
      join(outDir, 'system', 'compile-request.json'),
      `${JSON.stringify({ ...request, files: undefined }, null, 2)}\n`,
      'utf-8'
    )
    await publishRuntimeBundle(outDir, spec.name, result.runtime)
    await publishReactBundle({
      outDir,
      systemName: spec.name,
      stylePropNames: result.runtime.stylePropNames,
    })
    await publishTypesBundle(outDir, spec)
    linkGeneratedPackages(cwd, outDir)
    markPhase('publishEnd')

    return { outDir, spec }
  } catch (error) {
    rmSync(outDir, { recursive: true, force: true })
    throw error
  } finally {
    markPhase('syncEnd')
  }
}
