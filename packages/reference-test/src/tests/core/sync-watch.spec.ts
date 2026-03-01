import { test, expect } from '@playwright/test'
import { writeFile, appendFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSandboxDir } from '../../environments/lib/config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const METRICS_PATH = join(__dirname, '..', '..', '..', '.watch-metrics.jsonl')

/** Generate a random hex color that Panda has never seen (ensures codegen must run). */
function randomHexColor(): string {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Hex to rgb string for comparing with getComputedStyle */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
}

function buildSyncWatchContent(hexColor: string): string {
  return `import { css } from '@reference-ui/react'

/**
 * Slice for testing ref sync --watch: user updates css() style, expect it to appear.
 * Uses a random color so Panda codegen MUST run to extract it – proves watch works.
 */
export default function SyncWatch() {
  return (
    <div
      data-testid="sync-watch"
      className={css({
        color: '${hexColor}',
        padding: 'test-md',
        borderRadius: 'test-round',
      })}
    >
      SyncWatch: ref sync --watch
    </div>
  )
}
`
}

test.describe('sync-watch', () => {
  test('ref sync --watch picks up css() style change and it appears on screen', async ({
    page,
  }) => {
    const sandboxDir = getSandboxDir()
    const syncWatchPath = join(sandboxDir, 'tests', 'SyncWatch.tsx')

    const randomColor = randomHexColor()
    const expectedRgb = hexToRgb(randomColor)

    await page.goto('/')
    const el = page.getByTestId('sync-watch')
    await expect(el).toBeVisible()

    const t0 = Date.now()
    await writeFile(syncWatchPath, buildSyncWatchContent(randomColor))

    await expect
      .poll(
        async () => {
          const color = await el.evaluate((e) => getComputedStyle(e).color)
          return color === expectedRgb
        },
        { timeout: 30_000 }
      )
      .toBe(true)

    const timeToChangeMs = Date.now() - t0
    const project = process.env.REF_TEST_PROJECT ?? 'unknown'
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      timeToChangeMs,
      project,
      test: 'sync-watch',
    }) + '\n'
    await appendFile(METRICS_PATH, entry)
    console.log(`[sync-watch] timeToChange: ${timeToChangeMs}ms (file → visible)`)
  })
})
