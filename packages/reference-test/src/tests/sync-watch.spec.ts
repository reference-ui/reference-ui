import { test, expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getSandboxDir(): string {
  const project = process.env.REF_TEST_PROJECT
  if (!project) throw new Error('REF_TEST_PROJECT required (set by run-matrix.ts)')
  return join(__dirname, '..', '..', '.sandbox', project)
}

/** Hex to rgb string for comparing with getComputedStyle */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
}

const UPDATED_CONTENT = `import { css } from '@reference-ui/react'

/**
 * Slice for testing ref sync --watch: user updates css() style, expect it to appear.
 * The sync-watch spec edits this file to change the color.
 */
export default function SyncWatch() {
  return (
    <div
      data-testid="sync-watch"
      className={css({
        color: '#dc2626',
        padding: 'test-md',
        borderRadius: 'test-round',
      })}
    >
      SyncWatch: ref sync --watch
    </div>
  )
}
`

test.describe('sync-watch', () => {
  test('ref sync --watch picks up css() style change and it appears on screen', async ({
    page,
  }) => {
    const sandboxDir = getSandboxDir()
    const syncWatchPath = join(sandboxDir, 'tests', 'SyncWatch.tsx')

    await page.goto('/')
    const el = page.getByTestId('sync-watch')
    await expect(el).toBeVisible()

    // Edit css() – ref sync --watch is not instant, pipeline takes time
    await writeFile(syncWatchPath, UPDATED_CONTENT)

    // Wait for the color to change (watch → virtual → system → packager → vite hmr)
    const expectedRgb = hexToRgb('#dc2626')
    await expect
      .poll(
        async () => {
          const color = await el.evaluate((e) => getComputedStyle(e).color)
          return color === expectedRgb
        },
        { timeout: 30_000 }
      )
      .toBe(true)
  })
})
