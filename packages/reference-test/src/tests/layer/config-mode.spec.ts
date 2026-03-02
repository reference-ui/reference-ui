import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { REF_LIB_CANARY } from '@reference-ui/lib'
import { addToConfig, getSandboxDir } from '../../environments/lib/config.js'
import { waitForRefSyncReady } from '../../environments/lib/ref-sync.js'

test.describe.serial('layer', () => {
  test('addToConfig with layers only writes valid ui.config.ts', async () => {
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    const content = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(content).toContain('layers: [baseSystem]')
    expect(content).toContain("import { baseSystem } from '@reference-ui/lib'")
  })

  test('addToConfig with extends only writes valid ui.config.ts', async () => {
    await addToConfig({ extends: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    const content = await readFile(join(sandboxDir, 'ui.config.ts'), 'utf-8')
    expect(content).toContain('extends: [baseSystem]')
    expect(content).not.toContain('layers:')
  })

  test('layers only – refLibCanary renders via data-layer', async ({ page }) => {
    await addToConfig({ extends: '[]', layers: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    await waitForRefSyncReady(sandboxDir)
    await page.goto('/')
    const inside = page.getByTestId('layers-test')
    await expect(inside).toBeVisible()
    const insideColor = await inside.evaluate((e) => getComputedStyle(e).color)
    expect(insideColor).toBe(REF_LIB_CANARY)
    const outside = page.getByTestId('layers-outside')
    await expect(outside).toBeVisible()
    const outsideColor = await outside.evaluate((e) => getComputedStyle(e).color)
    expect(outsideColor).not.toBe(REF_LIB_CANARY)
  })

  test('extends only – refLibCanary renders via :root', async ({ page }) => {
    await addToConfig({ extends: '[baseSystem]' })
    const sandboxDir = getSandboxDir()
    await waitForRefSyncReady(sandboxDir)
    await page.goto('/')
    const el = page.getByTestId('extends-test')
    await expect(el).toBeVisible()
    const color = await el.evaluate((e) => getComputedStyle(e).color)
    expect(color).toBe(REF_LIB_CANARY)
  })
})
