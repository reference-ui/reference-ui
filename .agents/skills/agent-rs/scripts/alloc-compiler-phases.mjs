/**
 * Per-compiler-phase allocation section renderer for `pnpm agentrs alloc`.
 *
 * It takes the trace-leg Rust dump and emits the compiler-phase table: one
 * row per pipeline stage with the bytes and blocks allocated and freed
 * inside the phase plus live at its edges, so the reserve/arena work can
 * see which phase allocates what and what each phase retains. The sums
 * read against the span totals with an honest unphased remainder (guard
 * gaps, prologue/epilogue, cross-thread noise). Peak stays span-global and
 * is never attributed per phase. Pre-/3 dumps without rows render a
 * not-recorded line instead of failing.
 */

function mib(bytes) {
  return `${(bytes / 1048576).toFixed(1)} MiB`
}

function sumKey(phases, key) {
  return phases.reduce((total, phase) => total + phase[key], 0)
}

function phaseRow(phase) {
  const net = phase.allocBytes - phase.freeBytes
  const live = `${mib(phase.liveAtEnter)} → ${mib(phase.liveAtExit)}`
  return `| ${phase.name} | ${phase.wallMs.toFixed(1)} | ${mib(phase.allocBytes)} | ${phase.allocBlocks} | ${mib(phase.freeBytes)} | ${mib(net)} | ${live} |`
}

function reconcileLines(phases, span) {
  const wallSum = sumKey(phases, 'wallMs')
  const allocSum = sumKey(phases, 'allocBytes')
  const freeSum = sumKey(phases, 'freeBytes')
  return [
    `Phase sums: ${wallSum.toFixed(1)} ms of ${span.wallMs.toFixed(1)} span ms;`,
    `${mib(allocSum)} of ${mib(span.allocBytes)} span alloc,`,
    `${mib(freeSum)} of ${mib(span.freeBytes)} span freed.`,
    `Unphased remainder: ${(span.wallMs - wallSum).toFixed(1)} ms, ${mib(span.allocBytes - allocSum)} alloc,`,
    `${mib(span.freeBytes - freeSum)} freed (guard gaps + prologue/epilogue + cross-thread noise;`,
    'phase teardown such as the retained-parse drop lands here, visible as live discontinuities).',
  ]
}

export function compilerPhaseLines(rust) {
  if (!rust || !Array.isArray(rust.phases) || rust.phases.length === 0) {
    return [
      '## Compiler-phase allocation (Rust span, per phase)',
      '',
      'Per-phase rows not recorded by this dump (pre-agentrs-alloc/3 instrument).',
      '',
    ]
  }
  return [
    '## Compiler-phase allocation (Rust span, per phase)',
    '',
    'Sequential slices of the blocking call: allocated/freed inside the phase,',
    'net retained out of it, live at its edges. Peak stays span-global — it is',
    'never attributed per phase.',
    '',
    '| phase | wall ms | alloc | blocks | freed | net | live enter → exit |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rust.phases.map(phaseRow),
    '',
    ...reconcileLines(rust.phases, rust.span),
    '',
  ]
}
