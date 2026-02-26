/**
 * Run Playwright tests for each matrix entry.
 * Playwright doesn't support per-project webServer, so we run each project separately
 * with REF_TEST_PROJECT set so the config uses the correct sandbox.
 * Uses blob reporter + merge so the final report includes all projects.
 */

import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { MATRIX, getPort } from './matrix.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLOB_DIR = join(__dirname, '..', 'blob-reports')

async function run(): Promise<void> {
  await mkdir(BLOB_DIR, { recursive: true })

  for (let i = 0; i < MATRIX.length; i++) {
    const entry = MATRIX[i]
    if (i > 0) await new Promise((r) => setTimeout(r, 1500)) // Let OS release ports
    console.log(`\n▶ ${entry.name}`)
    const blobPath = join(BLOB_DIR, `${entry.name}.zip`)
    const result = await execa(
      'pnpm',
      ['exec', 'playwright', 'test', '--project', entry.name],
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
    if (result.exitCode !== 0) {
      process.exit(result.exitCode)
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
