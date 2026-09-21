/**
 * Libc census leg for `pnpm agentrs counters`.
 *
 * It takes the interpose shim source and emits a compiled dylib plus the
 * parsed census: per-libc-call counts, nanoseconds, and bytes for the whole
 * worker run. A bare `node -e ''` startup census runs under the same shim so
 * the harness can subtract node-init noise; the net is the sync-attributable
 * file-IO story. Wall time from this leg is unscored — the counts are the
 * instrument, and they only see calls routed through libc.
 */

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export const CENSUS_OUT_ENV = 'COUNTERS_CENSUS_OUT'
export const SHIM_SOURCE = 'counters-interpose.c'

function scriptsDir() {
  return new URL('.', import.meta.url).pathname
}

export function shimSourcePath() {
  return path.join(scriptsDir(), SHIM_SOURCE)
}

function ccVersion() {
  const probe = spawnSync('cc', ['--version'], { encoding: 'utf-8' })
  if (probe.status === 0 && probe.stdout) return probe.stdout.split('\n')[0].trim()
  return 'unknown'
}

export function buildCountersShim() {
  const source = shimSourcePath()
  const dir = mkdtempSync(path.join(tmpdir(), 'neo-counters-shim-'))
  const dylib = path.join(dir, 'libcounters-interpose.dylib')
  const build = spawnSync('cc', ['-dynamiclib', '-O2', '-o', dylib, source], { encoding: 'utf-8' })
  if (build.status !== 0) {
    throw new Error(`counters shim build failed: ${(build.stderr || build.stdout || '').trim() || `code ${build.status}`}`)
  }
  return {
    dylib,
    dir,
    source: path.relative(process.cwd(), source) || source,
    cc: ccVersion(),
    sourceSha256: createHash('sha256').update(readFileSync(source)).digest('hex'),
  }
}

function spawnCapture(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8')
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8')
    })
    child.on('error', (err) => resolve({ code: 1, stdout, stderr, error: err.message }))
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }))
  })
}

export async function runShimmed(command, args, env) {
  return spawnCapture(command, args, env)
}

export function readCensus(censusPath, leg) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(censusPath, 'utf-8'))
  } catch {
    throw new Error(`${leg} leg wrote no census dump at ${censusPath}`)
  }
  if (!parsed || parsed.schema !== 1 || !parsed.calls || typeof parsed.calls !== 'object') {
    throw new Error(`${leg} leg census dump at ${censusPath} has an unexpected shape`)
  }
  return parsed
}

function numOrZero(row, key) {
  const value = row[key]
  return typeof value === 'number' ? value : 0
}

function wantsKey(full, base, key) {
  return typeof full[key] === 'number' || typeof base[key] === 'number'
}

function isNegative(row) {
  if (row.count < 0) return true
  if (typeof row.totalNs === 'number' && row.totalNs < 0) return true
  return typeof row.bytes === 'number' && row.bytes < 0
}

function netRow(name, full, base) {
  const row = { count: numOrZero(full, 'count') - numOrZero(base, 'count') }
  if (wantsKey(full, base, 'totalNs')) row.totalNs = numOrZero(full, 'totalNs') - numOrZero(base, 'totalNs')
  if (wantsKey(full, base, 'bytes')) row.bytes = numOrZero(full, 'bytes') - numOrZero(base, 'bytes')
  if (isNegative(row)) row.noisy = true
  return [name, row]
}

export function subtractCensus(census, startup) {
  const names = new Set([...Object.keys(census.calls), ...Object.keys(startup.calls)])
  const net = {}
  for (const name of names) {
    const [key, row] = netRow(name, census.calls[name] ?? {}, startup.calls[name] ?? {})
    net[key] = row
  }
  return { schema: 1, calls: net }
}
