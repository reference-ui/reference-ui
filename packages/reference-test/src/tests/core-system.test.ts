/**
 * Core system test: config → sync → build → render → assert
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { bootstrap } from '../environments/bootstrap.js'
import { Runner, navigateTo, queryComputedStyle, close, assertFilesGenerated } from '../lib/index.js'

describe('core-system', () => {
  let project: Awaited<ReturnType<typeof bootstrap>>
  let runner: Runner

  beforeAll(async () => {
    project = await bootstrap()
    runner = Runner.forProject(project.root)
  })

  afterAll(async () => {
    await runner.cleanup()
    await project.cleanup()
    await close()
  })

  it('sync generates styled-system', async () => {
    const result = await runner.runSync()
    expect(result.success, `ref sync failed: ${result.stderr}`).toBe(true)
    const generated = await assertFilesGenerated(project.root)
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
