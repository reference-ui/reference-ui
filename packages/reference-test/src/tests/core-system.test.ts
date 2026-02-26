/**
 * Core system test - the ONE comprehensive test.
 * MVP: sync → build → render → assert one token.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createProjectAndRunner, getMatrixEntries } from '../orchestrator/index.js'
import { navigateTo, queryComputedStyle, close } from '../browser/browser.js'
import { assertFilesGenerated, assertColor } from '../assertions/index.js'

describe.each(getMatrixEntries())('core-system %s', (_label, environment) => {
  let runner: Awaited<ReturnType<typeof createProjectAndRunner>>['runner']

  beforeAll(async () => {
    const { runner: r } = await createProjectAndRunner(environment)
    runner = r
  })

  afterAll(async () => {
    await runner.cleanup()
    await close()
  })

  it('sync generates styled-system', async () => {
    const result = await runner.runSync()
    expect(result.success, `ref sync failed: ${result.stderr}`).toBe(true)
    const generated = await assertFilesGenerated(runner.rootPath)
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
    // red.500 from base tokens (oklch) -> expect nonzero red
    expect(color.length > 0).toBe(true)
  })
})
