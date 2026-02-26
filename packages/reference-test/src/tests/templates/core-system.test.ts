/**
 * Core system test - runs from within the generated project.
 * Environment-agnostic: Runner auto-detects bundler from project files.
 */

import { describe, it, expect, afterAll } from 'vitest'
import {
  Runner,
  navigateTo,
  queryComputedStyle,
  close,
  assertFilesGenerated,
} from '@reference-ui/reference-test'

describe('core-system', () => {
  const runner = Runner.forProject(process.cwd())

  afterAll(async () => {
    try {
      await runner.cleanup()
    } finally {
      await close()
    }
    setTimeout(() => process.exit(0), 500)
  })

  it('sync generates styled-system', async () => {
    const result = await runner.runSync()
    expect(result.success, `ref sync failed: ${result.stderr}`).toBe(true)
    const generated = await assertFilesGenerated(process.cwd())
    expect(generated).toBe(true)
  })

  it('build succeeds', async () => {
    const result = await runner.runBuild()
    expect(result.success, `build failed: ${result.stderr}`).toBe(true)
  })

  it('renders with token applied', async () => {
    const url = await runner.runDev()
    await navigateTo(url)
    const color = await queryComputedStyle('[data-testid="app-box"]', 'color')
    expect(color.length > 0).toBe(true)
  })
})
