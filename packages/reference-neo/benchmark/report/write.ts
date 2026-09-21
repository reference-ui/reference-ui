// Pinned report writer for Neo sync benchmarks.
// It takes an already-resolved pin plus every finished scale and emits the folder.
// Each pin holds result.json for machines and report.md for humans, nothing else.
// The pin arrives resolved: this module never talks to git itself.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { arch, platform, totalmem } from 'node:os'
import { join } from 'node:path'
import { renderReadout, type MachineInfo, type RunRecord, type ScaleResult } from './markdown.ts'
import type { PinInfo } from './pin.ts'

export interface ReportInput {
  scales: ScaleResult[]
}

function currentMachine(): MachineInfo {
  return {
    node: process.version,
    platform: `${platform()} ${arch()}`,
    arch: arch(),
    totalMem: totalmem(),
  }
}

export function writeReport(
  reportsRoot: string,
  pin: PinInfo,
  input: ReportInput,
): { dir: string; record: RunRecord } {
  const dir = join(reportsRoot, pin.name)
  const record: RunRecord = {
    revision: pin.name,
    hash: pin.hash,
    dirty: pin.dirty,
    createdAt: new Date().toISOString(),
    machine: currentMachine(),
    scales: input.scales,
  }
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'result.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf-8')
  writeFileSync(join(dir, 'report.md'), renderReadout(record), 'utf-8')
  return { dir, record }
}
