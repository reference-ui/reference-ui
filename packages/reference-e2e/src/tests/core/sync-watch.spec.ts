import { test, expect } from '@playwright/test'
import { writeFile, appendFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSandboxDir } from '../../environments/lib/config'
import { waitForRefSyncReady } from '../../environments/lib/ref-sync'
import { testRoutes } from '../../environments/base/routes'

const __dirname = dirname(fileURLToPath(import.meta.url))
const METRICS_PATH = join(__dirname, '..', '..', '..', '.watch-metrics.jsonl')
const INITIAL_BACKGROUND = '#2563eb'
const UPDATED_BACKGROUND = '#dc2626'

/** Hex to rgb string for comparing with getComputedStyle */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

function buildSyncWatchContent(hexColor: string): string {
  return `import { css } from '@reference-ui/react'

/**
 * Slice for testing ref sync --watch: user updates css() style, expect it to appear.
 * The sync-watch spec edits this file to change the background from blue to red.
 */
export default function SyncWatch() {
  return (
    <div
      data-testid="sync-watch"
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '14rem',
        minHeight: '6rem',
        color: '#ffffff' as never,
        backgroundColor: '${hexColor}' as never,
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
    test.setTimeout(90_000)
    const sandboxDir = getSandboxDir()
    const syncWatchPath = join(sandboxDir, 'tests', 'SyncWatch.tsx')
    const originalContent = await readFile(syncWatchPath, 'utf-8')

    const expectedRgb = hexToRgb(UPDATED_BACKGROUND)

    try {
      await page.goto(testRoutes.syncWatch)
      const el = page.getByTestId('sync-watch')
      await expect(el).toBeVisible()
      await expect
        .poll(
          async () => el.evaluate((e) => getComputedStyle(e).backgroundColor),
          { timeout: 15_000 }
        )
        .toBe(hexToRgb(INITIAL_BACKGROUND))

      const t0 = Date.now()
      const ready = waitForRefSyncReady(sandboxDir, { timeout: 60_000 })
      await writeFile(syncWatchPath, buildSyncWatchContent(UPDATED_BACKGROUND))
      await ready

      await expect
        .poll(
          async () => {
            const color = await el.evaluate((e) => getComputedStyle(e).backgroundColor)
            return color === expectedRgb
          },
          { timeout: 60_000 }
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
    } finally {
      if (originalContent !== buildSyncWatchContent(UPDATED_BACKGROUND)) {
        const ready = waitForRefSyncReady(sandboxDir, { timeout: 60_000 })
        await writeFile(syncWatchPath, originalContent)
        await ready
      }
    }
  })
})
