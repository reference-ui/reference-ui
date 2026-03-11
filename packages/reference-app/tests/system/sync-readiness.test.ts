import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const fixtureRoot = resolve(pkgRoot, 'tests', 'fixtures', 'sync-readiness')
const fixtureOutDir = join(fixtureRoot, '.reference-ui')
const generatedDir = join(fixtureRoot, 'src', 'generated')
const fixtureConfigPath = join(fixtureRoot, 'ui.config.ts')
const refCore = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)

const READY_MESSAGE = '[ref sync] ready'
const STALE_MARKER = 'sync-readiness-stale'
const FRESH_MARKER = 'sync-readiness-fresh'
const GENERATED_FILE_COUNT = 250

const reactEntryPath = join(fixtureOutDir, 'react', 'react.mjs')
const systemEntryPath = join(fixtureOutDir, 'system', 'system.mjs')
const baseSystemPath = join(fixtureOutDir, 'system', 'baseSystem.mjs')

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

function resetFixture(): void {
  rmSync(fixtureOutDir, { recursive: true, force: true })
  rmSync(generatedDir, { recursive: true, force: true })
  rmSync(join(fixtureRoot, 'node_modules', '@reference-ui'), { recursive: true, force: true })
  writeFileSync(
    fixtureConfigPath,
    `import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: '${FRESH_MARKER}',
  include: ['src/**/*.{ts,tsx}'],
  debug: true,
})
`,
    'utf-8'
  )
}

function seedStaleOutputs(): void {
  mkdirSync(join(fixtureOutDir, 'react'), { recursive: true })
  mkdirSync(join(fixtureOutDir, 'system'), { recursive: true })

  writeFileSync(reactEntryPath, `export const layer = "${STALE_MARKER}"\n`, 'utf-8')
  writeFileSync(systemEntryPath, `export const systemName = "${STALE_MARKER}"\n`, 'utf-8')
  writeFileSync(baseSystemPath, `export const baseSystem = "${STALE_MARKER}"\n`, 'utf-8')
}

function writeGeneratedSources(): void {
  mkdirSync(generatedDir, { recursive: true })

  for (let i = 0; i < GENERATED_FILE_COUNT; i += 1) {
    writeFileSync(
      join(generatedDir, `File${i}.tsx`),
      `export const Generated${i} = () => <div data-generated="${i}">generated ${i}</div>\n`,
      'utf-8'
    )
  }
}

async function waitForLog(
  logs: { stdout: string; stderr: string },
  marker: string,
  maxMs = 30_000
): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    if (logs.stdout.includes(marker) || logs.stderr.includes(marker)) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  throw new Error(`Timed out waiting for "${marker}"\nstdout:\n${logs.stdout}\nstderr:\n${logs.stderr}`)
}

afterEach(() => {
  resetFixture()
})

describe('sync readiness', () => {
  it('does not report ready from stale outputs before current runtime packages are rewritten', async () => {
    resetFixture()
    seedStaleOutputs()
    writeGeneratedSources()

    const logs = { stdout: '', stderr: '' }
    const syncProcess = spawn('node', [refCore, 'sync', '--watch', '--debug'], {
      cwd: fixtureRoot,
      stdio: 'pipe',
      detached: true,
    })

    syncProcess.stdout.on('data', (chunk: Buffer | string) => {
      logs.stdout += chunk.toString()
    })
    syncProcess.stderr.on('data', (chunk: Buffer | string) => {
      logs.stderr += chunk.toString()
    })

    try {
      await waitForLog(logs, READY_MESSAGE)

      expect(existsSync(reactEntryPath)).toBe(true)
      expect(existsSync(baseSystemPath)).toBe(true)
      expect(readFileSync(reactEntryPath, 'utf-8')).toContain(FRESH_MARKER)
      expect(readFileSync(reactEntryPath, 'utf-8')).not.toContain(STALE_MARKER)
      expect(readFileSync(baseSystemPath, 'utf-8')).toContain(FRESH_MARKER)
      expect(readFileSync(baseSystemPath, 'utf-8')).not.toContain(STALE_MARKER)
    } finally {
      killProcessTree(syncProcess.pid)
    }
  }, 45_000)
})
