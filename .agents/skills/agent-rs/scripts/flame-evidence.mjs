/**
 * Filed evidence writer for `pnpm agentrs flame`.
 *
 * It takes the capture context, the generated repo, and the samply record,
 * and emits the evidence directory: meta.json with the full pinned procedure,
 * plus summary.md joined from the presymbolicated sidecar. The pin follows the
 * bench convention (clean tree hashes, dirty trees overwrite `latest`), and a
 * dirty capture files its git status excerpt so the baseline stays honest.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { indexSidecar, loadProfile, renderSummaryMarkdown, summarizeProfile } from './flame-summary.mjs'

export function resolveEvidenceDir(repoRoot, options, pin) {
  if (options.outDir) return path.resolve(options.outDir)
  return path.join(repoRoot, 'docs', 'evidence', 'flamegraph', `${options.scale}-${pin.name}`)
}

function gitStatusExcerpt(repoRoot) {
  try {
    const probe = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf-8' })
    if (probe.status !== 0 || !probe.stdout) return []
    return probe.stdout.trim().split('\n').slice(0, 20)
  } catch {
    return []
  }
}

function profileMeta(record, rate) {
  return {
    file: 'profile.json.gz',
    bytes: statSync(record.profilePath).size,
    rateHz: rate,
    presymbolicated: record.sidecarPath !== null,
  }
}

export function buildFlameMeta(ctx, repo, record, native) {
  return {
    procedure: ctx.procedure,
    scale: ctx.options.scale,
    pin: ctx.pin,
    plan: repo.plan,
    generated: repo.generated,
    worker: record.sample,
    profile: profileMeta(record, ctx.options.rate),
    node: { version: process.version, args: record.nodeArgs },
    native,
    samply: ctx.samplyVersion,
    platform: `${process.platform}-${process.arch}`,
    command: record.command,
    createdAt: new Date().toISOString(),
    treeStatus: ctx.pin.dirty ? gitStatusExcerpt(ctx.repoRoot) : [],
  }
}

function writeSummary(evidenceDir, record, meta) {
  if (!record.sidecarPath) return null
  const sidecar = JSON.parse(readFileSync(record.sidecarPath, 'utf-8'))
  const summary = summarizeProfile(loadProfile(record.profilePath), indexSidecar(sidecar))
  const markdown = renderSummaryMarkdown(summary, {
    scale: meta.scale,
    pinName: meta.pin.name,
    rateHz: meta.profile.rateHz,
  })
  writeFileSync(path.join(evidenceDir, 'summary.md'), markdown)
  return summary
}

export function writeFlameEvidence(evidenceDir, record, meta) {
  writeFileSync(path.join(evidenceDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  return writeSummary(evidenceDir, record, meta)
}
