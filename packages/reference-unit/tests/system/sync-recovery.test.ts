import { describe, expect, it } from 'vitest'
import { execSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const fixtureRoot = resolve(pkgRoot, 'tests', 'fixtures', 'sync-recovery')
const fixtureOutDir = join(fixtureRoot, '.reference-ui')
const pandaConfigPath = join(fixtureOutDir, 'panda.config.ts')
const reactEntryPath = join(fixtureOutDir, 'react', 'react.mjs')
const styledCssPath = join(fixtureOutDir, 'styled', 'styles.css')
const baseSystemPath = join(fixtureOutDir, 'system', 'baseSystem.mjs')
const refCore = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)

function killProcessTree(pid: number | undefined): void {
  if (!pid) return

  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Process may already be gone.
    }
  }
}

async function waitForPath(
  path: string,
  maxMs = 15_000
): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    if (existsSync(path)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  throw new Error(`Timed out waiting for ${path}`)
}

describe('sync interruption recovery', () => {
  it('recovers cleanly from a killed sync and produces valid final artifacts on rerun', async () => {
    execSync(`node "${refCore}" clean`, {
      cwd: fixtureRoot,
      stdio: 'pipe',
      timeout: 15_000,
    })

    const interruptedSync = spawn('node', [refCore, 'sync'], {
      cwd: fixtureRoot,
      stdio: 'pipe',
      detached: true,
    })

    try {
      await waitForPath(pandaConfigPath)
    } finally {
      killProcessTree(interruptedSync.pid)
    }

    expect(existsSync(pandaConfigPath)).toBe(true)
    expect(existsSync(reactEntryPath)).toBe(false)

    execSync(`node "${refCore}" sync`, {
      cwd: fixtureRoot,
      stdio: 'pipe',
      timeout: 45_000,
    })

    expect(existsSync(reactEntryPath)).toBe(true)
    expect(existsSync(styledCssPath)).toBe(true)
    expect(existsSync(baseSystemPath)).toBe(true)

    const reactEntry = readFileSync(reactEntryPath, 'utf-8')
    const baseSystem = readFileSync(baseSystemPath, 'utf-8')

    expect(reactEntry).toContain('sync-recovery')
    expect(baseSystem).toContain('"name": "sync-recovery"')
    expect(baseSystem).toContain('[data-layer=\\"sync-recovery\\"]')
  }, 60_000)
})
