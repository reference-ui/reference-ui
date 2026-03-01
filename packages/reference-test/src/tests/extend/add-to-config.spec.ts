import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { REF_LIB_CANARY } from '@reference-ui/lib'
import { addToConfig, getSandboxDir } from '../../environments/lib/config.js'

test.describe('extend', () => {
  test('addToConfig merges additions onto base and writes valid ui.config.ts', async () => {
    await addToConfig({ debug: false })

    const sandboxDir = getSandboxDir()
    const configPath = join(sandboxDir, 'ui.config.ts')
    const content = await readFile(configPath, 'utf-8')

    expect(content).toContain("import { defineConfig } from '@reference-ui/core'")
    expect(content).toContain('defineConfig(')
    expect(content).toContain('reference-test')
    expect(content).toContain('"debug": false')
    expect(content).toContain('skipTypescript')
  })

  test('extends reference-lib baseSystem – refLibCanary token renders', async ({
    page,
  }) => {
    await page.goto('/')
    const el = page.getByTestId('extends-test')
    await expect(el).toBeVisible()
    const color = await el.evaluate((e) => getComputedStyle(e).color)
    expect(color).toBe(REF_LIB_CANARY)
  })
})
