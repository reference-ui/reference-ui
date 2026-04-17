/**
 * Run Playwright tests for each matrix entry.
 * Playwright doesn't support per-project webServer, so we run each project separately
 * with REF_TEST_PROJECT set so the config uses the correct sandbox.
 * Uses blob reporter + merge so the final report includes all projects.
 */

import { mkdir, rm } from 'node:fs/promises'
import { finished } from 'node:stream/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWriteStream } from 'node:fs'
import { execa } from 'execa'
import { MATRIX, getPort } from './index'
import { loadConfig } from '../config/index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOB_DIR = join(__dirname, '..', '..', 'blob-reports')
/** Outside `test-results/`: Playwright clears that directory when each run starts, which would delete nested matrix logs between serial matrix projects. */
const LOG_DIR = join(__dirname, '..', '..', 'matrix-logs')
const REPORT_DIR = join(__dirname, '..', '..', 'playwright-report')

export async function run(): Promise<void> {
  await rm(BLOB_DIR, { recursive: true, force: true }).catch(() => {})
  await rm(LOG_DIR, { recursive: true, force: true }).catch(() => {})
  await mkdir(BLOB_DIR, { recursive: true })
  await mkdir(LOG_DIR, { recursive: true })

  const cfg = loadConfig()
  const workersArg = ['--workers', String(cfg.workers)]
  const parallel = cfg.parallelSandboxes

  async function runProject(entry: (typeof MATRIX)[number]) {
    console.log(`\n▶ ${entry.name}`)
    const blobPath = join(BLOB_DIR, `${entry.name}.zip`)
    const logPath = join(LOG_DIR, `${entry.name}.log`)
    const logStream = createWriteStream(logPath)
    const subprocess = execa(
      'pnpm',
      [
        'exec',
        'playwright',
        'test',
        '--project',
        entry.name,
        ...workersArg,
      ],
      {
        env: {
          ...process.env,
          REF_TEST_PROJECT: entry.name,
          REF_TEST_PORT: String(getPort(entry)),
          PLAYWRIGHT_BLOB_OUTPUT: blobPath,
        },
        all: true,
        reject: false,
      }
    )

    subprocess.all?.pipe(logStream)
    const result = await subprocess
    await finished(logStream)

    if ((result.exitCode ?? 0) === 0) {
      console.log(`✓ ${entry.name} passed`)
    } else {
      console.log(`✖ ${entry.name} failed (log: ${logPath})`)
    }

    return { entry, exitCode: result.exitCode ?? 0, logPath }
  }

  if (parallel) {
    const results = await Promise.all(MATRIX.map(runProject))
    const failed = results.find((r) => r.exitCode !== 0)
    if (failed) process.exit(failed.exitCode)
  } else {
    for (const entry of MATRIX) {
      const { exitCode } = await runProject(entry)
      if (exitCode !== 0) process.exit(exitCode)
    }
  }

  console.log(`\nProject logs written to ${LOG_DIR}`)

  console.log('\n📊 Merging reports...')
  await execa(
    'pnpm',
    ['exec', 'playwright', 'merge-reports', '--reporter=html', BLOB_DIR],
    { stdio: 'inherit' }
  )

  if (process.env.CI) {
    console.log(`Playwright HTML report available at ${REPORT_DIR}`)
    return
  }

  console.log('Opening report in browser...')
  try {
    await execa('pnpm', ['exec', 'playwright', 'show-report'], {
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn(
      `Could not open the Playwright HTML report automatically. The merged report is still available at ${REPORT_DIR}.`
    )
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
