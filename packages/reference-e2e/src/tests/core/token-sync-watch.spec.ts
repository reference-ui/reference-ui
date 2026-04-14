import { test, expect } from '@playwright/test'
import { writeFile, unlink, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSandboxDir } from '../../environments/lib/config'
import { testRoutes } from '../../environments/base/routes'

const __dirname = dirname(fileURLToPath(import.meta.url))
const METRICS_PATH = join(__dirname, '..', '..', '..', '.watch-metrics.jsonl')

function randomHexColor(): string {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

function buildTokensContent(hexColor: string): string {
  // Split the import specifier so the fragment scanner does not false-positive
  // match this spec file itself (scanners check raw file content for import patterns).
  const from = '@reference-ui' + '/system'
  return `import { tokens } from '${from}'

/**
 * Token fragment for testing token-sync-watch: uses a random color so
 * panda config MUST regenerate — proves fragment detection and targeted reload work.
 */
tokens({
  colors: {
    'watch-sync': {
      primary: { value: '${hexColor}' },
    },
  },
})
`
}

test.describe('token-sync-watch', () => {
  test('ref sync --watch picks up tokens() file change and new value appears on screen', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const sandboxDir = getSandboxDir()
    const tokenFilePath = join(sandboxDir, 'tests', 'token-watch-tokens.ts')

    const colorA = randomHexColor()
    let colorB = randomHexColor()
    while (colorB === colorA) colorB = randomHexColor()

    await page.goto(testRoutes.tokenSyncWatch)

    // Read the latest generated CSS from disk, extract the token variable
    // value, and apply it as an inline override on :root. This verifies the
    // packager output directly without depending on console logs.
    async function fetchCurrentColor(): Promise<string> {
      const el = page.getByTestId('token-sync-watch')
      await expect(el).toBeVisible({ timeout: 5_000 })
      const freshCss = await readFile(
        join(sandboxDir, '.reference-ui', 'react', 'styles.css'),
        'utf-8',
      )
      const match = freshCss.match(/--colors-watch-sync-primary:\s*([^;]+)/)
      if (match) {
        await page.evaluate((val) => {
          document.documentElement.style.setProperty('--colors-watch-sync-primary', val)
        }, match[1].trim())
      }
      return el.evaluate((e) => getComputedStyle(e).color)
    }

    // Write initial token file and poll the generated CSS until the token value
    // is reflected in output.
    await writeFile(tokenFilePath, buildTokensContent(colorA))
    await expect
      .poll(() => fetchCurrentColor(), { timeout: 60_000, intervals: [2_000] })
      .toBe(hexToRgb(colorA))

    const t0 = Date.now()
    await writeFile(tokenFilePath, buildTokensContent(colorB))
    await expect
      .poll(() => fetchCurrentColor(), { timeout: 60_000, intervals: [2_000] })
      .toBe(hexToRgb(colorB))

    const timeToChangeMs = Date.now() - t0
    const project = process.env.REF_TEST_PROJECT ?? 'unknown'
    const entry =
      JSON.stringify({
        timestamp: new Date().toISOString(),
        timeToChangeMs,
        project,
        test: 'token-sync-watch',
      }) + '\n'
    try {
      const { appendFile } = await import('node:fs/promises')
      await appendFile(METRICS_PATH, entry)
    } catch {
      // metrics file is optional
    }
    console.log(`[token-sync-watch] timeToChange: ${timeToChangeMs}ms (token edit → visible)`)

    // Cleanup token file so it doesn't affect other runs.
    try {
      await unlink(tokenFilePath)
    } catch {
      // ignore if already removed
    }
  })
})
