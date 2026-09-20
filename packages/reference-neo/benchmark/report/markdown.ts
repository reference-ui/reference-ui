// Markdown readout for Neo benchmark reports.
// It takes one finished run record and emits the human text.
// Readouts lead with the big three per scale — peak RSS, sync time, total bundle — beside the load.
// result.json carries the same record for machines; there is no other rendering.

import { formatCount, formatKiB, formatMiB, formatMs, median } from './format.ts'
import type { GeneratedStats } from '../generate/generators/index.ts'
import type { BundleSizes, WorkerSample } from '../measure/child.ts'
import type { LoadPlan } from '../generate/plans.ts'

export interface ScaleResult {
  plan: LoadPlan
  generated: Omit<GeneratedStats, 'projectDir'>
  genMs: number
  samples: WorkerSample[]
  bundle: BundleSizes
}

export interface MachineInfo {
  node: string
  platform: string
  arch: string
  totalMem: number
}

export interface RunRecord {
  revision: string
  hash: string | null
  dirty: boolean
  createdAt: string
  machine: MachineInfo
  scales: ScaleResult[]
}

export function medianSyncMs(scale: ScaleResult): number {
  return median(scale.samples.map((sample) => sample.syncMs))
}

export function medianPeakRss(scale: ScaleResult): number {
  return median(scale.samples.map((sample) => sample.rssPeak))
}

function summaryTable(record: RunRecord): string[] {
  const lines = [
    '## summary',
    '',
    '| scale | files | css() calls | peak RSS | sync | bundle |',
    '| --- | --- | --- | --- | --- | --- |',
  ]
  for (const scale of record.scales) {
    lines.push(
      `| ${scale.plan.scale} | ${formatCount(scale.generated.styleFiles)} `
        + `| ${formatCount(scale.generated.cssCalls)} | ${formatMiB(medianPeakRss(scale))} `
        + `| ${formatMs(medianSyncMs(scale))} | ${formatKiB(scale.bundle.totalBytes)} |`,
    )
  }
  lines.push('')
  return lines
}

function scaleSection(scale: ScaleResult): string[] {
  const generated = scale.generated
  const lines = [
    `## ${scale.plan.scale}`,
    '',
    `seed ${scale.plan.seed} · ${scale.samples.length} run(s) · generated in ${formatMs(scale.genMs)}`,
    '',
    `- peak RSS: ${formatMiB(medianPeakRss(scale))}`,
    `- sync time: ${formatMs(medianSyncMs(scale))}`,
    `- bundle: ${formatKiB(scale.bundle.totalBytes)} (${formatKiB(scale.bundle.totalGzip)} gzip)`,
    '',
    '### load',
    '',
    `- generator: ${scale.plan.generator}`,
    `- style files: ${formatCount(generated.styleFiles)} (+${formatCount(generated.deadFiles)} dead)`,
    `- css() calls: ${formatCount(generated.cssCalls)} · recipes: ${formatCount(generated.recipes)}`,
    `- tokens: ${scale.plan.tokenColors} colors / ${scale.plan.tokenSpacing} spacing`,
    `- unique ratio: ${scale.plan.uniqueRatio} · conditions: ${scale.plan.conditionRatio} · responsive: ${scale.plan.responsiveRatio}`,
    '',
    '### runs',
    '',
    '| # | sync | peak RSS |',
    '| - | --- | ------- |',
  ]
  scale.samples.forEach((sample, index) => {
    lines.push(`| ${index + 1} | ${formatMs(sample.syncMs)} | ${formatMiB(sample.rssPeak)} |`)
  })
  lines.push('', '### bundle', '')
  lines.push(`- styles.css: ${formatKiB(scale.bundle.cssBytes)} (${formatKiB(scale.bundle.cssGzip)} gzip)`)
  lines.push(`- runtime-data.mjs: ${formatKiB(scale.bundle.dataBytes)} (${formatKiB(scale.bundle.dataGzip)} gzip)`)
  lines.push(`- total: ${formatKiB(scale.bundle.totalBytes)} (${formatKiB(scale.bundle.totalGzip)} gzip)`)
  lines.push('')
  return lines
}

export function renderReadout(record: RunRecord): string {
  const head = [
    `# bench — ${record.revision}`,
    '',
    `${record.createdAt} · ${record.machine.platform} · ${formatMiB(record.machine.totalMem)} RAM · node ${record.machine.node}`,
    '',
  ]
  const sections = record.scales.flatMap((scale) => scaleSection(scale))
  return [...head, ...summaryTable(record), ...sections].join('\n')
}
