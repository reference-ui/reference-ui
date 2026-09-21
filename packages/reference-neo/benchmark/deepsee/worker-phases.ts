// Single-sync phased worker for the deepsee burndown.
// It takes a project dir, a sample interval, and a go-file path, then runs one
// timed sync. The phase timers replicate sync() step for step (config, fragment
// prepare, fragment evaluation, one native compile, publish) so the stage walls
// are exact and the emitted folder stays byte-identical to a bench sync.
// The go-file handshake lets the parent attach `sample` before timing starts;
// the RSS timeline ticks around the whole sync. Emits one JSON line on stdout.

import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { compileNative, type NativeDiagnostic, type ScopedCompileRequest } from '../../src/sync/native.ts'
import { loadUserConfig } from '../../src/config/load.ts'
import { getOutDirPath } from '../../src/lib/paths/index.ts'
import {
  createPortableFragmentBundle,
  evaluatePreparedFragments,
  prepareFragments,
} from '../../src/fragments/index.ts'
import { resolveJsxElements } from '../../src/sync/jsx-elements.ts'
import { applyNormalizeCss } from '../../src/sync/reset.ts'
import { PRIMITIVE_JSX_NAMES } from '../../src/primitives/tags.ts'
import { linkGeneratedPackages, publishRuntimeBundle, publishSyncFolder, publishTypesBundle } from '../../src/sync/publish.ts'
import { publishReactBundle } from '../../src/sync/react.ts'

interface WorkerArgs {
  dir: string
  sampleMs: number
  goFile: string
}

interface PhaseSample {
  t: number
  rss: number
}

function parseArgs(argv: string[]): WorkerArgs {
  const dir = argv[2]
  const sampleMs = Number(argv[3])
  const goFile = argv[4]
  if (!dir || !goFile) throw new Error('usage: worker-phases.ts <project-dir> <sample-ms> <go-file>')
  if (!Number.isFinite(sampleMs) || sampleMs < 1) throw new Error(`invalid sample interval: ${argv[3] ?? '(none)'}`)
  return { dir, sampleMs, goFile }
}

async function waitForGo(goFile: string): Promise<void> {
  const deadline = Date.now() + 90000
  for (;;) {
    if (existsSync(goFile)) return
    if (Date.now() > deadline) throw new Error('timed out waiting for the sampler go-file')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

function uniqueSorted(names: readonly string[]): string[] {
  return [...new Set(names)].sort()
}

function throwOnErrorDiagnostics(diagnostics: NativeDiagnostic[]): void {
  const errors = diagnostics.filter((entry) => entry.severity === 'error')
  if (errors.length === 0) return
  throw new Error(`native compile failed:\n${errors.map((e) => `- ${e.message}`).join('\n')}`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv)
  process.stderr.write(`READY ${process.pid}\n`)
  await waitForGo(args.goFile)

  const phases: Record<string, number> = {}
  const timeline: PhaseSample[] = []
  const t0 = performance.now()
  const rssBefore = process.memoryUsage().rss
  let rssPeak = rssBefore
  const sampler = setInterval(() => {
    const current = process.memoryUsage().rss
    if (current > rssPeak) rssPeak = current
    timeline.push({ t: performance.now() - t0, rss: current })
  }, args.sampleMs)
  sampler.unref()

  const syncStarted = performance.now()
  const syncStartEpochMs = Date.now()
  const config = await loadUserConfig(args.dir)
  phases['config'] = performance.now() - syncStarted
  const outDir = getOutDirPath(args.dir)
  rmSync(outDir, { recursive: true, force: true })

  const preparedAt = performance.now()
  const prepared = await prepareFragments(args.dir, config)
  phases['fragments.prepare'] = performance.now() - preparedAt

  const evaluatedAt = performance.now()
  const spec: EvaluatedSystemSpec = await evaluatePreparedFragments(args.dir, config, prepared)
  applyNormalizeCss(spec, config.normalizeCss)
  phases['fragments.evaluate'] = performance.now() - evaluatedAt

  const requested = resolveJsxElements(config)
  const request: ScopedCompileRequest = {
    schemaVersion: 1,
    spec,
    jsxHosts: uniqueSorted([...requested.merged, ...PRIMITIVE_JSX_NAMES]),
    sourceRoot: args.dir,
    declarationRoot: args.dir,
    include: config.include,
    logs: config.logs,
  }
  const nativeAt = performance.now()
  const result = await compileNative(request)
  phases['native.compile'] = performance.now() - nativeAt
  throwOnErrorDiagnostics(result.diagnostics)

  const publishAt = performance.now()
  const jsx = resolveJsxElements(config, result.tracedJsxHosts ?? [])
  publishSyncFolder({
    outDir,
    spec,
    portableFragment: createPortableFragmentBundle(prepared),
    stylesheet: result.stylesheet,
    portableStylesheet: result.portableStylesheet ?? '',
    jsx,
  })
  writeFileSync(join(outDir, 'system', 'compile-request.json'), `${JSON.stringify(request, null, 2)}\n`, 'utf-8')
  await publishRuntimeBundle(outDir, spec.name, result.runtime)
  await publishReactBundle({
    outDir,
    systemName: spec.name,
    stylePropNames: result.runtime.stylePropNames,
  })
  await publishTypesBundle(outDir, spec)
  linkGeneratedPackages(args.dir, outDir)
  phases['publish'] = performance.now() - publishAt

  clearInterval(sampler)
  const syncMs = performance.now() - syncStarted
  const rssAfter = process.memoryUsage().rss
  if (rssAfter > rssPeak) rssPeak = rssAfter
  process.stderr.write('SYNC-DONE\n')
  timeline.push({ t: performance.now() - t0, rss: rssAfter })
  phases['sync.total'] = syncMs
  const boundaries: Record<string, number> = {}
  let cursor = 0
  for (const stage of ['config', 'fragments.prepare', 'fragments.evaluate', 'native.compile', 'publish']) {
    cursor += phases[stage] ?? 0
    boundaries[stage] = cursor
  }
  const payload: Record<string, number> = {}
  const resultRecord = result as unknown as Record<string, unknown>
  for (const key of Object.keys(resultRecord)) {
    payload[key] = Buffer.byteLength(JSON.stringify(resultRecord[key]) ?? '', 'utf-8')
  }
  payload['(total-json)'] = Buffer.byteLength(JSON.stringify(result), 'utf-8')
  console.log(JSON.stringify({
    phases,
    boundaries,
    syncStartEpoch: syncStartEpochMs,
    rssBefore,
    rssPeak,
    rssAfter,
    samples: timeline.length,
    timeline,
    payload,
  }))
}

try {
  await main()
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}
