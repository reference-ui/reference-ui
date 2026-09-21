/**
 * Reprocessing path for `pnpm agentrs counters --resummarize`.
 *
 * It takes a filed counters bundle plus the current procedure and emits a new
 * bundle directory: the raw dumps (span, census, startup, phases files) are
 * copied aside untouched while every derivation (span deltas, net census,
 * phase buckets) re-runs under the new procedure. Bundles from before the
 * phases era resummarize too, with null phases sections. The source bundle is
 * never modified; resummarizedFrom names it with raw shas for provenance.
 */

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { bucketCensusEvents, checkEventsAgainstCensus, readCensus, readCensusEvents, subtractCensus } from './counters-census.mjs'
import { deriveSpan, gitStatusExcerpt } from './counters-evidence.mjs'
import { censusPhasesMeta, spanPhasesMeta } from './counters-phases.mjs'
import { phaseWindows, readPhases } from './phases.mjs'

export function readCountersSpanDump(spanPath) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(spanPath, 'utf-8'))
  } catch {
    throw new Error(`span dump at ${spanPath} is not readable JSON`)
  }
  if (!parsed || parsed.schema !== 1 || !parsed.span || !parsed.span.before || !parsed.span.after) {
    throw new Error(`span dump at ${spanPath} has an unexpected shape`)
  }
  return parsed
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function readCountersSourceMeta(src) {
  let parsed = null
  try {
    parsed = JSON.parse(readFileSync(path.join(src, 'meta.json'), 'utf-8'))
  } catch {
    parsed = null
  }
  if (!parsed || !parsed.scale || !parsed.spanLeg || !parsed.censusLeg) {
    throw new Error(`not a filed counters bundle (missing meta.json with scale/legs): ${src}`)
  }
  return parsed
}

function requireCountersSourceFile(src, file) {
  const filePath = path.join(src, file)
  try {
    statSync(filePath)
  } catch {
    throw new Error(`resummarize source is missing ${file}: ${src}`)
  }
  return filePath
}

function copyPhaseFile(src, out, file) {
  try {
    statSync(path.join(src, file))
  } catch {
    return null
  }
  copyFileSync(path.join(src, file), path.join(out, file))
  return path.join(out, file)
}

function defaultCountersResummaryDir(src, procedure) {
  const version = String(procedure).split('/')[1] ?? '?'
  return `${src}-counters${version}`
}

function resummarizeSpanPhases(src, out, spanDump) {
  if (!copyPhaseFile(src, out, 'span-phases.json')) return null
  const phases = readPhases(path.join(out, 'span-phases.json'), 'span')
  return spanPhasesMeta({ phases, span: spanDump })
}

function resummarizeCensusPhases(src, out) {
  if (!copyPhaseFile(src, out, 'census-phases.json')) return null
  if (!copyPhaseFile(src, out, 'census-events.json')) return null
  const phases = readPhases(path.join(out, 'census-phases.json'), 'census')
  const census = readCensus(path.join(out, 'census.json'), 'census')
  const log = readCensusEvents(path.join(out, 'census-events.json'), 'census')
  const bucketed = bucketCensusEvents(log, phaseWindows(phases))
  checkEventsAgainstCensus(log, bucketed, census)
  return censusPhasesMeta({
    phases,
    events: { file: 'census-events.json', count: log.count, dropped: log.dropped ?? 0 },
    bucketed,
  })
}

function buildCountersResummaryMeta(ctx) {
  const { request, srcMeta, src, out, derived, censusNet, spanPhases, censusPhases } = ctx
  return {
    procedure: request.procedure,
    procedureNote: request.procedureNote,
    scale: srcMeta.scale,
    pin: srcMeta.pin,
    plan: srcMeta.plan,
    generated: srcMeta.generated,
    spanLeg: srcMeta.spanLeg,
    censusLeg: srcMeta.censusLeg,
    startupLeg: srcMeta.startupLeg,
    spanPhases,
    censusPhases,
    censusNet,
    derived,
    node: srcMeta.node,
    nativeShipped: srcMeta.nativeShipped,
    nativeCounters: srcMeta.nativeCounters,
    shim: srcMeta.shim,
    platform: srcMeta.platform,
    command: request.command,
    resummarizedFrom: {
      dir: path.relative(request.repoRoot, src) || src,
      procedure: srcMeta.procedure,
      createdAt: srcMeta.createdAt ?? null,
      spanSha256: sha256File(path.join(out, 'counters-span.json')),
      censusSha256: sha256File(path.join(out, 'census.json')),
      startupSha256: sha256File(path.join(out, 'census-startup.json')),
    },
    createdAt: new Date().toISOString(),
    treeStatus: gitStatusExcerpt(request.repoRoot),
  }
}

export function runCountersResummarize(request) {
  const src = path.resolve(request.srcDir)
  const out = request.outDir ? path.resolve(request.outDir) : defaultCountersResummaryDir(src, request.procedure)
  if (src === out) {
    throw new Error('refusing to resummarize a bundle onto itself — pick --out outside the source dir')
  }
  const srcMeta = readCountersSourceMeta(src)
  mkdirSync(out, { recursive: true })
  for (const file of ['counters-span.json', 'census.json', 'census-startup.json']) {
    copyFileSync(requireCountersSourceFile(src, file), path.join(out, file))
  }
  const spanDump = readCountersSpanDump(path.join(out, 'counters-span.json'))
  const derived = deriveSpan(spanDump.span, spanDump.spans ?? null)
  const censusNet = subtractCensus(
    readCensus(path.join(out, 'census.json'), 'census'),
    readCensus(path.join(out, 'census-startup.json'), 'startup baseline'),
  )
  const spanPhases = resummarizeSpanPhases(src, out, spanDump)
  const censusPhases = resummarizeCensusPhases(src, out)
  const meta = buildCountersResummaryMeta({ request, srcMeta, src, out, derived, censusNet, spanPhases, censusPhases })
  return { outDir: out, meta }
}
