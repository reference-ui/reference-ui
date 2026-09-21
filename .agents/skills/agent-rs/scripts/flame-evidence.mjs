/**
 * Filed evidence writer for `pnpm agentrs flame`.
 *
 * It takes the capture context, the generated repo, and the samply record,
 * and emits the evidence directory: meta.json with the full pinned procedure,
 * plus summary.md joined from the presymbolicated sidecar. The pin follows the
 * bench convention (clean tree hashes, dirty trees overwrite `latest`), and a
 * dirty capture files its git status excerpt so the baseline stays honest.
 * It also reprocesses a filed bundle's preserved raw profile under a newer
 * procedure without re-recording: the raw bytes are copied aside, so the
 * source bundle stays untouched and the new meta points back at it.
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
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

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
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
    procedureNote: ctx.procedureNote,
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
    procedure: meta.procedure,
    procedureNote: meta.procedureNote,
  })
  writeFileSync(path.join(evidenceDir, 'summary.md'), markdown)
  return summary
}

export function writeFlameEvidence(evidenceDir, record, meta) {
  writeFileSync(path.join(evidenceDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  return writeSummary(evidenceDir, record, meta)
}

function readSourceMeta(src) {
  let parsed = null
  try {
    parsed = JSON.parse(readFileSync(path.join(src, 'meta.json'), 'utf-8'))
  } catch {
    parsed = null
  }
  if (!parsed || !parsed.scale || !parsed.profile?.rateHz) {
    throw new Error(`not a filed flame bundle (missing meta.json with scale/profile): ${src}`)
  }
  return parsed
}

function requireSourceFile(src, file) {
  const filePath = path.join(src, file)
  try {
    statSync(filePath)
  } catch {
    throw new Error(`resummarize source is missing ${file}: ${src}`)
  }
  return filePath
}

function defaultResummaryDir(src, procedure) {
  const version = String(procedure).split('/')[1] ?? '?'
  return `${src}-flame${version}`
}

function buildResummaryMeta(request, srcMeta, src, out) {
  const profileCopy = path.join(out, 'profile.json.gz')
  const sidecarCopy = path.join(out, 'profile.json.syms.json')
  return {
    procedure: request.procedure,
    procedureNote: request.procedureNote,
    scale: srcMeta.scale,
    pin: srcMeta.pin,
    plan: srcMeta.plan,
    generated: srcMeta.generated,
    worker: srcMeta.worker,
    profile: {
      file: 'profile.json.gz',
      bytes: statSync(profileCopy).size,
      rateHz: srcMeta.profile.rateHz,
      presymbolicated: true,
    },
    node: srcMeta.node,
    native: srcMeta.native,
    samply: srcMeta.samply,
    platform: srcMeta.platform,
    command: request.command,
    resummarizedFrom: {
      dir: path.relative(request.repoRoot, src) || src,
      procedure: srcMeta.procedure,
      createdAt: srcMeta.createdAt ?? null,
      profileSha256: sha256File(profileCopy),
      sidecarSha256: sha256File(sidecarCopy),
    },
    createdAt: new Date().toISOString(),
    treeStatus: gitStatusExcerpt(request.repoRoot),
  }
}

function printResummaryReport(outDir, meta, summary) {
  console.log(`\n[agent-rs] flame resummary: ${outDir}`)
  console.log(`  from: ${meta.resummarizedFrom.dir} (${meta.resummarizedFrom.procedure})`)
  if (summary) {
    console.log('  top native self:')
    for (const frame of summary.nativeTop.slice(0, 5)) {
      console.log(`    ${frame.samples}x self / ${frame.inclusive}x incl ${frame.name.slice(0, 90)}`)
    }
  }
}

export function runResummarize(request) {
  const src = path.resolve(request.srcDir)
  const out = request.outDir ? path.resolve(request.outDir) : defaultResummaryDir(src, request.procedure)
  if (src === out) {
    throw new Error('refusing to resummarize a bundle onto itself — pick --out outside the source dir')
  }
  const srcMeta = readSourceMeta(src)
  const profilePath = requireSourceFile(src, 'profile.json.gz')
  const sidecarPath = requireSourceFile(src, 'profile.json.syms.json')
  mkdirSync(out, { recursive: true })
  copyFileSync(profilePath, path.join(out, 'profile.json.gz'))
  copyFileSync(sidecarPath, path.join(out, 'profile.json.syms.json'))
  const meta = buildResummaryMeta(request, srcMeta, src, out)
  const summary = writeFlameEvidence(out, {
    profilePath: path.join(out, 'profile.json.gz'),
    sidecarPath: path.join(out, 'profile.json.syms.json'),
  }, meta)
  printResummaryReport(out, meta, summary)
  return { outDir: out, meta, summary }
}
