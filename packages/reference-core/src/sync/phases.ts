// Same-run phase boundary recorder for instrument attribution (agentrs-phases/1).
// It takes markPhase calls at sync milestones and emits one phases.json per
// worker run when REFERENCE_UI_PHASES_OUT names a file. The bench worker owns
// the write; sync only marks, so library callers never see a file appear.
// Durations derive from the monotonic clock, so a wall-clock jump cannot bend
// a phase; every mark also carries unix milliseconds so samply samples and
// libc events align post-hoc. When the env var is unset every mark is one
// disabled branch — the voyage scorer and bench history never observe this module.

import { writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

export const PHASES_OUT_ENV = 'REFERENCE_UI_PHASES_OUT'
export const PHASES_SCHEMA = 1
export const PHASES_PROCEDURE = 'agentrs-phases/1'

// Read once at import: harnesses set the env var before spawning node, so a
// per-mark env lookup would buy nothing and cost a syscall-shaped branch.
const ENABLED = (process.env[PHASES_OUT_ENV] ?? '') !== ''

export interface PhaseMark {
  unixMs: number
  monoMs: number
}

export interface PhasesFile {
  schema: number
  procedure: string
  marks: Record<string, PhaseMark>
  phases: Record<string, number | null>
}

interface MarkEdge {
  from: string
  to: string
}

// The phase contract (mirrored by the agent-rs phases module): startup covers
// process start through sync entry, so module load is measured in-run instead
// of subtracted from another process; config covers author-config load, which
// dwarfs the leftover; syncResidual is the honest remainder (output rmdir,
// inter-mark gaps) that keeps the phases exact.
const PHASE_EDGES: Record<string, MarkEdge> = {
  startup: { from: 'processStart', to: 'syncStart' },
  config: { from: 'syncStart', to: 'configEnd' },
  scan: { from: 'scanStart', to: 'scanEnd' },
  evaluate: { from: 'scanEnd', to: 'evalEnd' },
  compile: { from: 'compileStart', to: 'compileEnd' },
  publish: { from: 'compileEnd', to: 'publishEnd' },
  syncTotal: { from: 'syncStart', to: 'syncEnd' },
  workerTotal: { from: 'processStart', to: 'workerEnd' },
  workerTail: { from: 'syncEnd', to: 'workerEnd' },
}

const marks = new Map<string, PhaseMark>()

export function markPhase(name: string): void {
  if (!ENABLED) return
  marks.set(name, { unixMs: Date.now(), monoMs: performance.now() })
}

export function markPhaseAt(name: string, unixMs: number, monoMs: number): void {
  if (!ENABLED) return
  marks.set(name, { unixMs, monoMs })
}

function edgeMs(edge: MarkEdge): number | null {
  const from = marks.get(edge.from)
  const to = marks.get(edge.to)
  if (!from || !to) return null
  return to.monoMs - from.monoMs
}

function residualMs(phases: Map<string, number | null>): number | null {
  const total = phases.get('syncTotal')
  const parts = ['config', 'scan', 'evaluate', 'compile', 'publish'].map(name => phases.get(name))
  const allParts = parts.every((part): part is number => typeof part === 'number')
  if (typeof total !== 'number' || !allParts) return null
  return total - parts.reduce((sum, part) => sum + part, 0)
}

export function writePhasesFile(): string | null {
  if (!ENABLED) return null
  const out = process.env[PHASES_OUT_ENV] ?? ''
  if (out === '') return null
  const phases = new Map<string, number | null>()
  for (const [name, edge] of Object.entries(PHASE_EDGES)) phases.set(name, edgeMs(edge))
  phases.set('syncResidual', residualMs(phases))
  const file: PhasesFile = {
    schema: PHASES_SCHEMA,
    procedure: PHASES_PROCEDURE,
    marks: Object.fromEntries(marks),
    phases: Object.fromEntries(phases),
  }
  writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`)
  return out
}
