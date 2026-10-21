#!/usr/bin/env node
// Dogfood runner behind `pnpm dogfood`: it syncs the shipped ref CLI across four packages.
// Unless --skip-build is set, it first rebuilds the CLI (pnpm agentrs b, then ensure-dist). It then runs
// `ref sync` in reference-icons, reference-lib, reference-docs and reference-lib/book, in that order, each
// under a 180 s timeout with RUST_MIN_STACK unset. A run fails on any signal, timeout, non-zero exit or
// git-status change it caused, and names the changed paths; a project owned by a watch session is flagged.
// Child output and human lines go to stderr under --json, where stdout holds one line:
// { "results": [{ "pkg", "ms", "status", "signal" }] }.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REF_BIN = join(ROOT, 'packages/reference-core/dist/bin/ref.js')
const ENSURE_DIST = join(ROOT, 'packages/reference-core/tools/ensure-dist.mjs')
const SYNC_TIMEOUT_MS = 180_000
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024
// Icons first: lib's ui.config imports the icons system output, so lib cannot sync before icons has run.
const PACKAGES = [
  'packages/reference-icons',
  'packages/reference-lib',
  'packages/reference-docs',
  'packages/reference-lib/book',
]
// Core's one-shot sync prints this and exits 0 when a watch session owns the project, so this run synced nothing.
const WATCHED_MARKER = 'already watching this project'
const FLAGS = new Set(['--skip-build', '--json'])

const args = new Set(process.argv.slice(2))
const json = args.has('--json')
const skipBuild = args.has('--skip-build')
// Human lines go to stdout; under --json stdout must hold only the JSON line, so they move to stderr.
const say = (line) => (json ? console.error(line) : console.log(line))

function fail(message) {
  console.error(`[dogfood] ${message}`)
  return 1
}

function describe(result) {
  if (result.error?.code === 'ETIMEDOUT') return `timed out after ${SYNC_TIMEOUT_MS / 1000} s`
  if (result.error) return result.error.message
  if (result.signal) return `killed by ${result.signal}`
  return `exit ${result.status}`
}

// Build children write straight to our stderr (fd 2), so stdout stays clean for --json.
function build() {
  const steps = [
    ['pnpm agentrs b', 'pnpm', ['agentrs', 'b']],
    ['ensure-dist', process.execPath, [ENSURE_DIST]],
  ]
  for (const [label, command, commandArgs] of steps) {
    say(`[dogfood] ${label}`)
    const result = spawnSync(command, commandArgs, { cwd: ROOT, stdio: ['ignore', 2, 2] })
    if (result.error || result.status !== 0) return fail(`${label} failed: ${describe(result)}`)
  }
  return 0
}

// --skip-build reuses a CLI that already exists; otherwise the build must succeed before any sync runs.
function prepare() {
  if (!skipBuild) return build() === 0
  if (existsSync(REF_BIN)) return true
  fail(`${REF_BIN} is missing; drop --skip-build to build it`)
  return false
}

// Porcelain is read without optional index locks, so this check never races another agent's git command.
function gitStatus() {
  const result = spawnSync('git', ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=all'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (result.error || result.status !== 0) {
    throw new Error(`git status failed: ${result.stderr?.trim() || describe(result)}`)
  }
  return result.stdout
}

function gitHead() {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : 'unknown'
}

function statusByPath(porcelain) {
  return new Map(porcelain.split('\n').filter(Boolean).map((line) => [line.slice(3), line.slice(0, 2)]))
}

// Names every path whose status differs before and after the run, including paths that appeared or vanished.
function changedPaths(before, after) {
  const was = statusByPath(before)
  const now = statusByPath(after)
  return [...new Set([...was.keys(), ...now.keys()])]
    .filter((path) => was.get(path) !== now.get(path))
    .sort()
    .map((path) => `${path} (${was.get(path) ?? 'clean'} -> ${now.get(path) ?? 'clean'})`)
}

// The sync runs with RUST_MIN_STACK unset, as in the measured baselines.
function syncEnv() {
  const env = { ...process.env }
  delete env.RUST_MIN_STACK
  return env
}

function isClean(result) {
  return !result.error && result.status === 0 && result.signal === null
}

function verdictOf(result, clean, watched) {
  if (!clean) return `FAILED: ${describe(result)}`
  return watched ? 'ok, but a watch session owns it: this run did not sync' : 'ok'
}

function syncPackage(pkg) {
  const started = performance.now()
  const result = spawnSync(process.execPath, [REF_BIN, 'sync'], {
    cwd: join(ROOT, pkg),
    env: syncEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: SYNC_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
  })
  const ms = Math.round(performance.now() - started)
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  process.stderr.write(output)
  const clean = isClean(result)
  const watched = clean && output.includes(WATCHED_MARKER)
  say(`[dogfood] ${pkg}  ${(ms / 1000).toFixed(2)} s  ${verdictOf(result, clean, watched)}`)
  return { clean, watched, row: { pkg, ms, status: result.status, signal: result.signal } }
}

// Runs the syncs in order and stops at the first failure, so no later package syncs against a broken earlier one.
function syncAll(results) {
  let watchedCount = 0
  for (const pkg of PACKAGES) {
    const { clean, watched, row } = syncPackage(pkg)
    results.push(row)
    watchedCount += watched ? 1 : 0
    if (!clean) return { ok: false, watchedCount }
  }
  return { ok: true, watchedCount }
}

// A moved HEAD means another agent committed during the run, so the listed paths may not be the sync's own.
function reportChanges(changed, headBefore, headAfter) {
  if (changed.length === 0) return
  const moved = headBefore === headAfter ? '' : ` (HEAD moved ${headBefore} -> ${headAfter} during the run)`
  console.error(`[dogfood] git status changed during the run${moved}:\n  ${changed.join('\n  ')}`)
}

function run(results) {
  if (!prepare()) return 1
  const before = gitStatus()
  const headBefore = gitHead()
  const started = performance.now()
  const syncs = syncAll(results)
  const seconds = ((performance.now() - started) / 1000).toFixed(2)
  const headAfter = gitHead()
  const changed = changedPaths(before, gitStatus())
  reportChanges(changed, headBefore, headAfter)
  if (!syncs.ok || changed.length > 0) return 1
  const entries = before.split('\n').filter(Boolean).length
  say(
    `[dogfood] ${results.length} syncs ok in ${seconds} s (${syncs.watchedCount} watch-owned, not synced); ` +
      `git status unchanged (${entries} pre-existing entries)`,
  )
  return 0
}

function main() {
  const unknown = [...args].filter((arg) => !FLAGS.has(arg))
  if (unknown.length > 0) {
    console.error(`usage: pnpm dogfood [--skip-build] [--json]   (unknown: ${unknown.join(' ')})`)
    return 2
  }
  const results = []
  let code
  try {
    code = run(results)
  } catch (err) {
    code = fail(err instanceof Error ? err.message : String(err))
  }
  if (json) process.stdout.write(`${JSON.stringify({ results })}\n`)
  return code
}

process.exitCode = main()
