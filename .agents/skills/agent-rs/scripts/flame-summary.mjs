/**
 * Samply profile summarizer for `pnpm agentrs flame`.
 *
 * It takes a recorded Firefox Profiler JSON (.json.gz) plus the presymbolicated
 * sidecar samply emits, and joins raw addresses to symbol names without a
 * browser. It emits the lib histogram and top self-time frames that land in
 * the filed summary.md, so a baseline stays readable from the repo alone.
 * Symbol lookup is closest-preceding RVA, the same rule profilers use.
 */

import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

export function indexSidecar(sidecar) {
  for (const lib of sidecar.data) lib.symbol_table.sort((a, b) => a.rva - b.rva)
  const tables = new Map()
  for (const lib of sidecar.data) {
    tables.set(`${lib.debug_name}|${lib.code_id}`, lib.symbol_table)
  }
  return { tables, strings: sidecar.string_table }
}

export function loadProfile(profilePath) {
  const raw = readFileSync(profilePath)
  const text = profilePath.endsWith('.gz') ? gunzipSync(raw).toString('utf-8') : raw.toString('utf-8')
  return JSON.parse(text)
}

function lookupSymbol(index, key, address) {
  const entries = index.tables.get(key)
  if (!entries) return null
  let low = 0
  let high = entries.length - 1
  let best = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (entries[mid].rva <= address) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  if (best < 0) return null
  return index.strings[entries[best].symbol] ?? null
}

function collectSelfHits(thread) {
  const { stackTable, frameTable, funcTable, samples } = thread
  const counts = new Map()
  for (let i = 0; i < samples.length; i += 1) {
    const frame = stackTable.frame[samples.stack[i]]
    const func = frameTable.func[frame]
    const key = `${funcTable.resource[func]}:${frameTable.address[frame]}:${func}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([key, count]) => {
    const [resource, address, func] = key.split(':').map(Number)
    return { resource, address, func, samples: count }
  })
}

function libOf(thread, libs, resource) {
  const index = thread.resourceTable.lib[resource]
  if (typeof index !== 'number' || !libs[index]) return { index: -1, name: '(unmapped jit)' }
  return { index, name: libs[index].name }
}

function rawFrameName(thread, func) {
  return thread.stringArray[thread.funcTable.name[func]] ?? 'unknown'
}

function symbolizeName(index, key, address, fallback) {
  if (!fallback.startsWith('0x')) return fallback
  return lookupSymbol(index, key, address) ?? fallback
}

function nameHit(thread, libs, index, hit) {
  const lib = libOf(thread, libs, hit.resource)
  const entry = libs[lib.index] ?? {}
  const raw = rawFrameName(thread, hit.func)
  const name = symbolizeName(index, `${entry.debugName}|${entry.codeId}`, hit.address, raw)
  return { samples: hit.samples, libName: lib.name, name }
}

function rankLibs(thread, libs, hits) {
  const counts = new Map()
  for (const hit of hits) {
    const lib = libOf(thread, libs, hit.resource)
    counts.set(lib.name, (counts.get(lib.name) ?? 0) + hit.samples)
  }
  return [...counts.entries()]
    .map(([name, samples]) => ({ name, samples }))
    .sort((a, b) => b.samples - a.samples)
}

function mainThread(profile) {
  return profile.threads.find((entry) => entry.isMainThread) ?? profile.threads[0]
}

export function summarizeProfile(profile, index) {
  const thread = mainThread(profile)
  const hits = collectSelfHits(thread)
  const named = hits.map((hit) => nameHit(thread, profile.libs, index, hit))
  named.sort((a, b) => b.samples - a.samples)
  return {
    threadName: thread.name,
    sampleCount: thread.samples.length,
    libs: rankLibs(thread, profile.libs, hits).slice(0, 12),
    top: named.slice(0, 25),
    nativeTop: named.filter((hit) => hit.libName.endsWith('.node')).slice(0, 20),
  }
}

function frameRow(frame, total) {
  const share = ((frame.samples / total) * 100).toFixed(1)
  const name = frame.name.length > 120 ? `${frame.name.slice(0, 117)}...` : frame.name
  return `| ${frame.samples} | ${share}% | ${frame.libName} | \`${name}\` |`
}

function libRow(lib, total) {
  return `| ${lib.samples} | ${((lib.samples / total) * 100).toFixed(1)}% | ${lib.name} |`
}

export function renderSummaryMarkdown(summary, meta) {
  const total = Math.max(1, summary.sampleCount)
  const lines = [
    `# Flame summary: ${meta.scale} (${meta.pinName})`,
    '',
    `Samples (main thread): ${summary.sampleCount} at ${meta.rateHz} Hz.`,
    'Profile: `profile.json.gz` — view with `samply load profile.json.gz`.',
    '',
    '## Samples by library (self)',
    '',
    '| samples | share | lib |',
    '| --- | --- | --- |',
  ]
  for (const lib of summary.libs) lines.push(libRow(lib, total))
  lines.push('', '## Top self frames', '', '| samples | share | lib | frame |', '| --- | --- | --- | --- |')
  for (const frame of summary.top) lines.push(frameRow(frame, total))
  lines.push(
    '',
    '## Top self frames in the native addon',
    '',
    '| samples | share | lib | frame |',
    '| --- | --- | --- | --- |',
  )
  if (summary.nativeTop.length === 0) lines.push('| — | — | — | no `.node` frames sampled |')
  for (const frame of summary.nativeTop) lines.push(frameRow(frame, total))
  lines.push('')
  return lines.join('\n')
}
