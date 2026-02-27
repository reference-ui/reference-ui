/**
 * Run Playwright tests for each matrix entry.
 * Playwright doesn't support per-project webServer, so we run each project separately
 * with REF_TEST_PROJECT set so the config uses the correct sandbox.
 * Uses blob reporter + merge so the final report includes all projects.
 */

import { mkdir, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { MATRIX, getPort } from './matrix.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOB_DIR = join(__dirname, '..', 'blob-reports')

async function run(): Promise<void> {
  await rm(BLOB_DIR, { recursive: true, force: true }).catch(() => {})
  await mkdir(BLOB_DIR, { recursive: true })

  const workersArg = process.env.REF_TEST_WORKERS
    ? ['--workers', process.env.REF_TEST_WORKERS]
    : []
  // Sequential by default – parallel ref sync --watch processes conflict on shared .virtual
  const parallel = process.env.REF_TEST_PARALLEL === '1'

  async function runProject(entry: (typeof MATRIX)[number]) {
    console.log(`\n▶ ${entry.name}`)
    const blobPath = join(BLOB_DIR, `${entry.name}.zip`)
    const result = await execa(
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
        stdio: 'inherit',
      }
    )
    return { entry, exitCode: result.exitCode ?? 0 }
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

  console.log('\n📊 Merging reports...')
  await execa(
    'pnpm',
    ['exec', 'playwright', 'merge-reports', '--reporter=html', BLOB_DIR],
    { stdio: 'inherit' }
  )
  console.log('Opening report in browser...')
  await execa('pnpm', ['exec', 'playwright', 'show-report'], {
    stdio: 'inherit',
  })
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
