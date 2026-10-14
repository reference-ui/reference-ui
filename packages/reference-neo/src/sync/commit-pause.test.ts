// Unit proof for the test-only commit pause (commit-pause.ts). Unarmed it returns at once and writes nothing; armed it writes its
// paused marker and holds until the resume marker for its pid exists; with no resume it throws naming the variable once the cap passes.
// The holding legs run the module in a child process, which is how a spec drives it: the parent watches for the marker and writes the
// resume file, since a blocked thread cannot do either itself. The cap and call-time legs run in this process over a temp dir.

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { COMMIT_PAUSE_ENV, pauseInCommit, pausedMarkerOf, resumeMarkerOf } from './commit-pause.ts'

const MODULE_URL = pathToFileURL(fileURLToPath(new URL('./commit-pause.ts', import.meta.url))).href
// Calls the pause as the commit does, then reports that the call returned.
const CHILD_SCRIPT = "const { pauseInCommit } = await import(process.argv[1]); pauseInCommit(); console.log('returned')"
// A marker that never shows reports its own failure inside the leg's budget, not as a generic test timeout.
const MARKER_BUDGET_MS = 20_000
const LEG_BUDGET_MS = 30_000

const tempDirs: string[] = []
const children: ChildProcess[] = []

afterEach(async () => {
  for (const child of children.splice(0)) child.kill('SIGKILL')
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'neo-commit-pause-'))
  tempDirs.push(dir)
  return dir
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

interface PauseChild {
  child: ChildProcess
  stdout: () => string
  exited: Promise<number | null>
}

// The pause module in its own process, with the variable set to pauseDir or absent, in cwd.
function startChild(cwd: string, pauseDir: string | undefined): PauseChild {
  const env: NodeJS.ProcessEnv = { ...process.env }
  if (pauseDir === undefined) delete env[COMMIT_PAUSE_ENV]
  else env[COMMIT_PAUSE_ENV] = pauseDir
  const child = spawn(process.execPath, ['--input-type=module', '-e', CHILD_SCRIPT, MODULE_URL], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  children.push(child)
  let out = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    out += chunk.toString('utf8')
  })
  const exited = new Promise<number | null>((resolve) => {
    child.on('close', (code) => resolve(code))
  })
  return { child, stdout: () => out, exited }
}

async function waitForPath(path: string): Promise<void> {
  const deadline = Date.now() + MARKER_BUDGET_MS
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`${path} never appeared`)
    await sleep(5)
  }
}

describe('the test-only commit pause', () => {
  it('returns at once and writes nothing when the variable is unset', async () => {
    const cwd = await makeTempDir()
    const run = startChild(cwd, undefined)

    expect(await run.exited).toBe(0)
    expect(run.stdout()).toBe('returned\n')
    expect(readdirSync(cwd)).toEqual([])
  }, LEG_BUDGET_MS)

  it('writes its paused marker and holds until the resume marker for its pid exists', async () => {
    const root = await makeTempDir()
    const pauseDir = join(root, 'pause')
    const run = startChild(root, pauseDir)
    const pid = run.child.pid
    if (pid === undefined) throw new Error('the pausing process did not start')

    await waitForPath(pausedMarkerOf(pauseDir, pid))
    // Only the resume marker releases it: a pause that fell through would have returned by now.
    await sleep(250)
    expect(run.child.exitCode).toBeNull()
    expect(run.stdout()).toBe('')

    // A resume marker for another pid is not its release.
    writeFileSync(resumeMarkerOf(pauseDir, pid + 1), '')
    await sleep(100)
    expect(run.child.exitCode).toBeNull()

    writeFileSync(resumeMarkerOf(pauseDir, pid), '')
    expect(await run.exited).toBe(0)
    expect(run.stdout()).toBe('returned\n')
  }, LEG_BUDGET_MS)

  it('throws naming the variable when nothing resumes it within the cap', async () => {
    const pauseDir = join(await makeTempDir(), 'pause')

    expect(() => pauseInCommit({ env: { [COMMIT_PAUSE_ENV]: pauseDir }, capMs: 30 })).toThrow(COMMIT_PAUSE_ENV)

    // The marker was written before the wait, so a spec that sees it can still tell this pause gave up.
    expect(existsSync(pausedMarkerOf(pauseDir, process.pid))).toBe(true)
    expect(existsSync(resumeMarkerOf(pauseDir, process.pid))).toBe(false)
  })

  it('reads the variable when it is called, not when the module loads', async () => {
    const pauseDir = join(await makeTempDir(), 'pause')
    mkdirSync(pauseDir)
    writeFileSync(resumeMarkerOf(pauseDir, process.pid), '')
    const before = process.env[COMMIT_PAUSE_ENV]
    process.env[COMMIT_PAUSE_ENV] = pauseDir
    try {
      pauseInCommit({ capMs: 5_000 })
    } finally {
      if (before === undefined) delete process.env[COMMIT_PAUSE_ENV]
      else process.env[COMMIT_PAUSE_ENV] = before
    }

    expect(existsSync(pausedMarkerOf(pauseDir, process.pid))).toBe(true)
  })
})
