#!/usr/bin/env node
// Dogfood runner behind `pnpm dogfood`: it syncs four packages in isolated temp copies.
// The copies live under the OS temp dir, so no watch session in the repo can answer for them. The CLI is rebuilt
// first (pnpm agentrs b, then ensure-dist) unless --skip-build, and docs' content-collections build runs in its copy
// before its sync. A run fails on any signal, timeout, non-zero exit, watch-owned copy or git-status change in the
// repo, and names the paths. Copies are removed on success and kept (path printed) on failure or with --keep. Child
// output goes to stderr; under --json, stdout holds one line: { "results": [{ "pkg", "ms", "status", "signal" }] }.
import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'))
const REF_BIN = join(ROOT, 'packages/reference-core/dist/bin/ref.js')
const ENSURE_DIST = join(ROOT, 'packages/reference-core/tools/ensure-dist.mjs')
const SYNC_TIMEOUT_MS = 180_000
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024
// Order matters: lib's ui.config imports icons' generated system, docs depends on lib, and book sits inside lib.
const SYNCS = ['packages/reference-icons', 'packages/reference-lib', 'packages/reference-docs', 'packages/reference-lib/book']
// Copied in full (book comes with lib); every other packages/ entry is linked to the repo instead.
const COPIED = ['packages/reference-icons', 'packages/reference-lib', 'packages/reference-docs']
// Steps a copy runs before its `ref sync`: docs' own sync script begins with this same content-collections build.
const PRE_STEPS = {
  'packages/reference-docs': [
    {
      label: 'content-collections build',
      bin: 'node_modules/.bin/content-collections',
      args: ['build', '--config', 'src/collections/content-collections.ts'],
    },
  ],
}
const WATCH_OWNER = /already watching this project \(pid (\d+)\)/
const FLAGS = new Set(['--skip-build', '--json', '--keep'])

const args = new Set(process.argv.slice(2))
const json = args.has('--json')
const skipBuild = args.has('--skip-build')
const keep = args.has('--keep')
// Human lines go to stdout; under --json stdout must hold only the JSON line, so they move to stderr.
const say = (line) => (json ? console.error(line) : console.log(line))
let copyRoot = null

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

function isClean(result) {
  return !result.error && result.status === 0 && result.signal === null
}

// The sync runs with RUST_MIN_STACK unset, as in the measured baselines.
function childEnv() {
  const env = { ...process.env }
  delete env.RUST_MIN_STACK
  return env
}

// Runs one command under the timeout; its output replays to stderr so nothing a sync printed is hidden.
function runStep(cwd, command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: childEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: SYNC_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  process.stderr.write(output)
  return { result, output }
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

// A moved HEAD means another agent committed during the run, so the listed paths may not be the run's own.
function reportChanges(changed, headBefore, headAfter) {
  if (changed.length === 0) return
  const moved = headBefore === headAfter ? '' : ` (HEAD moved ${headBefore} -> ${headAfter} during the run)`
  console.error(`[dogfood] git status changed during the run${moved}:\n  ${changed.join('\n  ')}`)
}

// Repo files git would ship (tracked or not ignored): gitignored outputs such as .reference-ui and dist never copy.
function sourceFiles() {
  const listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...COPIED], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: MAX_OUTPUT_BYTES,
  })
  return listed.split('\0').filter((rel) => rel && !/(^|\/)(node_modules|\.reference-ui)\//.test(rel))
}

function lstatOrNull(path) {
  try {
    return lstatSync(path)
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

// Copies one source file; a path listed but deleted in the worktree is skipped.
function copySource(rel) {
  const from = join(ROOT, rel)
  const st = lstatOrNull(from)
  if (!st) return
  const to = join(copyRoot, rel)
  mkdirSync(dirname(to), { recursive: true })
  if (st.isSymbolicLink()) symlinkSync(readlinkSync(from), to)
  else if (st.isFile()) copyFileSync(from, to)
}

// Recreates a node_modules tree with its links verbatim, so relative links keep resolving inside the copy.
function mirror(from, to) {
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from)) {
    const src = join(from, name)
    const dst = join(to, name)
    const st = lstatSync(src)
    if (st.isSymbolicLink()) symlinkSync(readlinkSync(src), dst)
    else if (st.isDirectory()) mirror(src, dst)
    else copyFileSync(src, dst)
  }
}

// Root files, the pnpm store and every packages/ entry the copies do not own are linked to the repo, never copied.
// That keeps the packages' relative links (pnpm store, workspace siblings, tsconfig.base.json, docs' INSTALL.md import)
// resolving as they do in the repo.
function linkRepoEntries() {
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.name !== '.git' && (entry.name === 'node_modules' || entry.isFile())) {
      symlinkSync(join(ROOT, entry.name), join(copyRoot, entry.name))
    }
  }
  mkdirSync(join(copyRoot, 'packages'))
  for (const name of readdirSync(join(ROOT, 'packages'))) {
    const rel = `packages/${name}`
    if (!COPIED.includes(rel)) symlinkSync(join(ROOT, rel), join(copyRoot, rel))
  }
}

// Each synced package keeps its own node_modules tree, mirrored with the repo's links.
function mirrorNodeModules() {
  for (const sync of SYNCS) {
    const nodeModules = join(ROOT, sync, 'node_modules')
    if (existsSync(nodeModules)) mirror(nodeModules, join(copyRoot, sync, 'node_modules'))
  }
}

function populateCopies() {
  linkRepoEntries()
  for (const rel of sourceFiles()) copySource(rel)
  mirrorNodeModules()
}

// One package in its copy: its pre-steps, then `ref sync`. A watch owner's answer is a failure, never a pass.
function syncPackage(sync) {
  const dir = join(copyRoot, sync)
  const steps = [
    ...(PRE_STEPS[sync] ?? []).map((step) => ({ label: step.label, command: join(dir, step.bin), args: step.args })),
    { label: 'ref sync', command: process.execPath, args: [REF_BIN, 'sync'] },
  ]
  const started = performance.now()
  let row = { pkg: sync, ms: 0, status: 0, signal: null }
  let verdict = 'ok'
  let ok = true
  for (const step of steps) {
    const { result, output } = runStep(dir, step.command, step.args)
    const owner = WATCH_OWNER.exec(output)
    if (owner) {
      verdict = `FAILED: watch session pid ${owner[1]} answered for this copy, so nothing was synced`
      row = { ...row, status: null, signal: null }
      ok = false
      break
    }
    row = { ...row, status: result.status, signal: result.signal }
    if (!isClean(result)) {
      verdict = `FAILED (${step.label}): ${describe(result)}`
      ok = false
      break
    }
  }
  row.ms = Math.round(performance.now() - started)
  say(`[dogfood] ${sync}  ${(row.ms / 1000).toFixed(2)} s  ${verdict}`)
  return { ok, row }
}

// Runs the packages in order and stops at the first failure, so no later package syncs against a broken earlier one.
function syncAll(results) {
  for (const sync of SYNCS) {
    const { ok, row } = syncPackage(sync)
    results.push(row)
    if (!ok) return false
  }
  return true
}

// Copies are removed on success. Their links point into the repo; rmSync unlinks a link and never follows it.
function finishCopies(ok) {
  if (ok && !keep) {
    rmSync(copyRoot, { recursive: true, force: true })
    return
  }
  say(`[dogfood] copies kept at ${copyRoot}`)
}

function run(results) {
  if (!prepare()) return 1
  const before = gitStatus()
  const headBefore = gitHead()
  const started = performance.now()
  copyRoot = mkdtempSync(join(tmpdir(), 'reference-dogfood-'))
  populateCopies()
  const copiedMs = performance.now() - started
  const synced = syncAll(results)
  const seconds = ((performance.now() - started) / 1000).toFixed(2)
  const headAfter = gitHead()
  const changed = changedPaths(before, gitStatus())
  reportChanges(changed, headBefore, headAfter)
  const ok = synced && changed.length === 0
  finishCopies(ok)
  if (!ok) return 1
  const entries = before.split('\n').filter(Boolean).length
  say(
    `[dogfood] ${results.length} syncs ok in ${seconds} s (copies ready in ${(copiedMs / 1000).toFixed(2)} s); ` +
      `git status unchanged (${entries} pre-existing entries)`,
  )
  return 0
}

function main() {
  const unknown = [...args].filter((arg) => !FLAGS.has(arg))
  if (unknown.length > 0) {
    console.error(`usage: pnpm dogfood [--skip-build] [--json] [--keep]   (unknown: ${unknown.join(' ')})`)
    return 2
  }
  const results = []
  let code
  try {
    code = run(results)
  } catch (err) {
    code = fail(err instanceof Error ? err.message : String(err))
    if (copyRoot) console.error(`[dogfood] copies kept at ${copyRoot}`)
  }
  if (json) process.stdout.write(`${JSON.stringify({ results })}\n`)
  return code
}

process.exitCode = main()
