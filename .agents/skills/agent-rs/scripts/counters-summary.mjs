/**
 * Summary renderer for `pnpm agentrs counters`.
 *
 * It takes the filed meta and emits summary.md: the span counter table, the
 * startup-subtracted libc census, and a per-room floor-vs-waste reading with
 * the bounds stated beside the verdicts. It also writes the evidence files
 * (meta.json via the evidence module, census-net.json, summary.md) so the
 * orchestrator stays a thin leg runner. Thresholds here are deliberately
 * coarse — the crew log carries the flame/alloc join and the final verdicts.
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { numOf, orZero, writeCountersMeta } from './counters-evidence.mjs'
import { countersPhasesLines } from './counters-phases.mjs'

function fmtInt(value) {
  if (value === null || value === undefined) return 'n/a'
  return Math.round(value).toLocaleString('en-US')
}

function fmtFixed(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a'
  return value.toFixed(digits)
}

function mib(bytes) {
  if (bytes === null || bytes === undefined) return 'n/a'
  return `${(bytes / 1048576).toFixed(1)} MiB`
}

function loadLines(meta) {
  const { plan, generated } = meta
  return [
    `# Counters report: ${meta.scale} (${meta.pin.name})`,
    '',
    `Load: ${generated.styleFiles} style files + ${generated.deadFiles} dead, ${generated.cssCalls} css() calls,`,
    `${generated.recipes} recipes, seed ${plan.seed} (frozen ${plan.generator} plan, no overrides).`,
    `Procedure: \`${meta.procedure}\`${meta.procedureNote ? ` — ${meta.procedureNote}` : ''}. Span leg profiles the release+counters-trace`,
    'instrument build (exact compile window); the census leg profiles the shipped',
    'release `.node` under the interpose shim (whole worker, startup-subtracted).',
    'Worker verbatim every leg; wall time on instrument legs is unscored.',
    '',
    '## Worker samples per leg',
    '',
    '| leg | syncMs | rssBefore | rssPeak | rssAfter |',
    '| --- | --- | --- | --- | --- |',
    `| span (instrument) | ${meta.spanLeg.sample.syncMs.toFixed(1)} | ${mib(meta.spanLeg.sample.rssBefore)} | ${mib(meta.spanLeg.sample.rssPeak)} | ${mib(meta.spanLeg.sample.rssAfter)} |`,
    `| census (shipped+shim) | ${meta.censusLeg.sample.syncMs.toFixed(1)} | ${mib(meta.censusLeg.sample.rssBefore)} | ${mib(meta.censusLeg.sample.rssPeak)} | ${mib(meta.censusLeg.sample.rssAfter)} |`,
    '',
  ]
}

function spanRow(label, value) {
  return `| ${label} | ${value} |`
}

function msOf(usec) {
  if (usec === null) return null
  return usec / 1000
}

function cpuPair(rusage) {
  return { userMs: msOf(numOf(rusage, 'userUsec')), sysMs: msOf(numOf(rusage, 'systemUsec')) }
}

function totalMs(cpu) {
  if (cpu.userMs === null || cpu.sysMs === null) return null
  return cpu.userMs + cpu.sysMs
}

function sysShareOf(cpu) {
  const total = totalMs(cpu)
  if (total === null || total <= 0) return null
  return (cpu.sysMs / total) * 100
}

function pctCell(share) {
  if (typeof share !== 'number') return 'n/a'
  return `${fmtFixed(share * 100, 0)}%`
}

function countCell(value) {
  return value === null ? 'n/a' : String(value)
}

function threadCountCell(threads) {
  return `${countCell(numOf(threads, 'enterCount'))} / ${countCell(numOf(threads, 'exitCount'))}`
}

function birthDeathCell(threads) {
  return `${countCell(numOf(threads, 'bornCount'))} born / ${countCell(numOf(threads, 'diedCount'))} died`
}

function unattributedCell(threads) {
  const usec = numOf(threads, 'unattributedUsec')
  if (usec === null) return 'n/a'
  return `${fmtFixed(usec / 1000, 1)} ms (${pctCell(numOf(threads, 'unattributedShare'))})`
}

function spanLines(derived) {
  const info = derived.info ?? {}
  const events = derived.events ?? {}
  const rusage = derived.rusage ?? {}
  const cpu = cpuPair(derived.rusage)
  return [
    `## Span counters (exact compile window, ${fmtFixed(derived.wallMs)} ms blocking call)`,
    '',
    '| counter | delta |',
    '| --- | --- |',
    spanRow('instructions', fmtInt(derived.instructions)),
    spanRow('cycles', fmtInt(derived.cycles)),
    spanRow('IPC (instr/cycle)', fmtFixed(derived.ipc, 2)),
    spanRow('user CPU (rusage)', `${fmtFixed(cpu.userMs)} ms`),
    spanRow('sys CPU (rusage)', `${fmtFixed(cpu.sysMs)} ms`),
    spanRow('unix syscalls', fmtInt(events.syscallsUnix)),
    spanRow('mach syscalls', fmtInt(events.syscallsMach)),
    spanRow('page faults (events)', fmtInt(events.faults)),
    spanRow('minor faults (rusage)', fmtInt(rusage.minorFaults)),
    spanRow('major faults (rusage)', fmtInt(rusage.majorFaults)),
    spanRow('pageins (disk-backed)', fmtInt(info.pageins)),
    spanRow('copy-on-write faults', fmtInt(events.cowFaults)),
    spanRow('context switches', fmtInt(events.csw)),
    spanRow('voluntary csw', fmtInt(rusage.voluntaryCsw)),
    spanRow('involuntary csw', fmtInt(rusage.involuntaryCsw)),
    spanRow('mach messages sent/rcvd', `${fmtInt(events.messagesSent)} / ${fmtInt(events.messagesReceived)}`),
    spanRow('disk read/written', `${mib(info.diskioBytesRead)} / ${mib(info.diskioBytesWritten)}`),
    spanRow('phys footprint delta', mib(info.physFootprint)),
    spanRow('threads enter/exit', threadCountCell(derived.threads)),
    spanRow('threads born/died in-window', birthDeathCell(derived.threads)),
    spanRow('window top-thread share (matched + born)', pctCell(numOf(derived.threads, 'windowTopShare'))),
    spanRow('window CPU unattributed (died-thread bound)', unattributedCell(derived.threads)),
    '',
  ]
}

function avgUsCell(row) {
  if (!(row.count > 0) || typeof row.totalNs !== 'number') return 'n/a'
  return fmtFixed(row.totalNs / row.count / 1000, 2)
}

function totalMsCell(row) {
  if (typeof row.totalNs !== 'number') return 'n/a'
  return fmtFixed(row.totalNs / 1e6, 2)
}

function censusBytesCell(row) {
  if (typeof row.bytes !== 'number') return '—'
  return fmtInt(row.bytes)
}

function censusRow(name, row) {
  const flag = row.noisy ? ' ~noisy' : ''
  return `| ${name} | ${fmtInt(row.count)}${flag} | ${totalMsCell(row)} | ${avgUsCell(row)} | ${censusBytesCell(row)} |`
}

function censusTable(net) {
  const names = Object.keys(net.calls).sort()
  if (names.length === 0) return ['| — | no calls recorded | — | — | — |']
  return names.map((name) => censusRow(name, net.calls[name]))
}

function censusLines(net) {
  return [
    '## Census (libc calls, whole worker minus bare-node startup)',
    '',
    '| call | count | total ms | avg µs | bytes |',
    '| --- | --- | --- | --- | --- |',
    ...censusTable(net),
    '',
    'Counts flagged ~noisy went negative after startup subtraction (run-to-run',
    'jitter exceeds the sync-attributable signal for that call); treat as zero.',
    'mmap bytes are virtual length requested (reservations), not bytes touched;',
    'read/pread/readv/write/pwrite/writev bytes are bytes transferred.',
    '',
  ]
}

function fileCount(meta) {
  return (meta.generated.styleFiles ?? 0) + (meta.generated.deadFiles ?? 0)
}

function callCount(net, name, key) {
  const row = net[name]
  if (!row) return 0
  return orZero(row[key])
}

function openTotals(net) {
  return {
    opens: callCount(net, 'open', 'count') + callCount(net, 'openat', 'count'),
    totalNs: callCount(net, 'open', 'totalNs') + callCount(net, 'openat', 'totalNs'),
  }
}

function ratioOf(part, whole) {
  if (whole === null || whole <= 0) return null
  return part / whole
}

function avgUsOf(totalNs, count) {
  if (!count) return null
  return totalNs / count / 1000
}

function openFloorVerdict(perFile) {
  if (perFile === null) return 'n/a'
  if (perFile <= 1.2) return 'FLOOR — about one open per file; opens are load, not waste'
  if (perFile <= 2) return 'NEAR FLOOR — opens track file count with modest overhead'
  return `WASTE — ${fmtFixed(perFile, 1)} opens per file deserves an open-count audit`
}

function verdictOpens(meta) {
  const totals = openTotals(meta.censusNet.calls)
  const perFile = ratioOf(totals.opens, fileCount(meta))
  const avgUs = avgUsOf(totals.totalNs, totals.opens)
  return `open/openat: ${fmtInt(totals.opens)} total, ${fmtFixed(perFile, 2)} per file, ${fmtFixed(avgUs, 1)} µs avg → ${openFloorVerdict(perFile)}.`
}

function syscallRate(unix, files) {
  if (unix === null) return null
  return ratioOf(unix, files)
}

function verdictSyscalls(meta) {
  const unix = numOf(meta.derived.events, 'syscallsUnix')
  const perFile = syscallRate(unix, fileCount(meta))
  const cpu = cpuPair(meta.derived.rusage)
  return `unix syscalls in-window: ${fmtInt(unix)} (${fmtFixed(perFile, 1)} per file); sys CPU ${fmtFixed(cpu.sysMs)} ms of ${fmtFixed(totalMs(cpu))} ms CPU (${fmtFixed(sysShareOf(cpu), 0)}% sys).`
}

function ipcVerdict(ipc) {
  if (ipc === null) return 'n/a'
  if (ipc >= 3) return 'very high'
  if (ipc >= 1.5) return 'healthy'
  if (ipc >= 0.8) return 'middling'
  return 'low'
}

function threadVerdict(share) {
  if (share === null) return 'n/a'
  if (share >= 0.95) return 'single-threaded — parallel lanes have headroom'
  if (share >= 0.7) return 'mostly serial — one thread carries the compile'
  return 'already parallel — the window spreads across threads'
}

function threadCaveat(threads) {
  // The span table always carries the exact remainder; the verdict only calls
  // out shares big enough to move the top-share reading (deliberately coarse).
  const share = numOf(threads, 'unattributedShare')
  if (typeof share !== 'number' || share < 0.01) return ''
  return `; ${pctCell(share)} of window CPU unattributed (died-thread bound)`
}

function verdictCompute(meta) {
  const derived = meta.derived
  const threads = derived.threads ?? {}
  const share = numOf(threads, 'windowTopShare')
  return [
    `IPC ${fmtFixed(derived.ipc, 2)} → ${ipcVerdict(derived.ipc)}.`,
    `Window top-thread share ${pctCell(share)} (${threadCountCell(threads)} threads, ${birthDeathCell(threads)}) → ${threadVerdict(share)}${threadCaveat(threads)}.`,
  ]
}

function diskVerdict(disk) {
  if (disk === 0) return 'warm — zero disk-backed faults in-window'
  return `${fmtInt(disk)} disk-backed faults in-window`
}

function verdictMemory(meta) {
  const derived = meta.derived
  const info = derived.info ?? {}
  const rusage = derived.rusage ?? {}
  const disk = orZero(rusage.majorFaults) + orZero(info.pageins)
  return [
    `Faults: ${fmtInt(rusage.minorFaults)} minor + ${fmtInt(rusage.majorFaults)} major (rusage), ${fmtInt(info.pageins)} pageins → ${diskVerdict(disk)}.`,
    `Disk IO: ${mib(info.diskioBytesRead)} read / ${mib(info.diskioBytesWritten)} written; footprint delta ${mib(info.physFootprint)}; involuntary csw ${fmtInt(rusage.involuntaryCsw)}.`,
  ]
}

function readingLines(meta) {
  return [
    '## Floor-vs-waste reading (counters alone; flame/alloc join lives in the crew log)',
    '',
    `- File-IO room: ${verdictOpens(meta)}`,
    `- Syscall room: ${verdictSyscalls(meta)}`,
    ...verdictCompute(meta).map((line) => `- Compute room: ${line}`),
    ...verdictMemory(meta).map((line) => `- Memory room: ${line}`),
    '',
    'Bounds used: one open per file is the floor. No width assumption is made:',
    'instructions and cycles are measured (rusage_info_v4) and read as IPC,',
    'with faults, pageins, and disk IO beside them. LLC misses are not',
    'countable rootless on macOS; IPC + faults are the honest proxies, and',
    'they explain results — no ceiling on possible savings is claimed here.',
    'Thread births inside the window count at their exit rows (exact); any',
    'remainder of window CPU past the exit-visible threads is reported as',
    'unattributed, bounding what died threads could have carried.',
    '',
  ]
}

function artifactLines(meta) {
  return [
    '## Artifacts (which binary is which)',
    '',
    '| build | profile | sha256 | builtVia |',
    '| --- | --- | --- | --- |',
    `| shipped | ${meta.nativeShipped.profile} | \`${meta.nativeShipped.sha256.slice(0, 12)}…\` | ${meta.nativeShipped.builtVia} |`,
    `| counters | ${meta.nativeCounters.profile} | \`${meta.nativeCounters.sha256.slice(0, 12)}…\` | ${meta.nativeCounters.builtVia} |`,
    `| shim | interpose dylib | \`${meta.shim.sourceSha256.slice(0, 12)}…\` | ${meta.shim.cc} |`,
    '',
    `Shipped: \`${meta.nativeShipped.path}\`. Counters: \`${meta.nativeCounters.path}\``,
    `(inputs ${meta.nativeCounters.inputsHash.slice(0, 12)}; dist/native never touched).`,
    `Shim source: \`${meta.shim.source}\` (built to a temp dir per run, deterministic).`,
    '',
  ]
}

export function renderCountersSummary(meta) {
  return [
    ...loadLines(meta),
    ...spanLines(meta.derived),
    ...censusLines(meta.censusNet),
    ...countersPhasesLines(meta),
    ...readingLines(meta),
    ...artifactLines(meta),
  ].join('\n')
}

export function writeCountersEvidence(evidenceDir, meta) {
  writeCountersMeta(evidenceDir, meta)
  writeFileSync(path.join(evidenceDir, 'census-net.json'), `${JSON.stringify(meta.censusNet, null, 2)}\n`)
  const summary = renderCountersSummary(meta)
  writeFileSync(path.join(evidenceDir, 'summary.md'), summary)
  return summary
}
