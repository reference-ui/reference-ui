/**
 * Core system test - runs ref sync and build in sandbox.
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { bootstrap } from '../environments/bootstrap.js'
import { Runner } from '../lib/runner.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('core-system', () => {
  let project: Awaited<ReturnType<typeof bootstrap>>

  beforeAll(async () => {
    project = await bootstrap()
  })

  afterAll(async () => {
    // Don't cleanup - keep .sandbox for inspection
  })

  it('ref sync works', async () => {
    const runner = Runner.forProject(project.root)
    const result = await runner.runSync()

    expect(result.success, `ref sync failed: ${result.stderr || result.stdout}`).toBe(true)

    // Verify expected artifacts: Panda outputs to core, packager deploys to react
    const coreSystemCss = join(project.root, 'node_modules/@reference-ui/core/src/system/styles.css')
    const reactStyles = join(project.root, 'node_modules/@reference-ui/react/styles.css')

    expect(
      existsSync(coreSystemCss) || existsSync(reactStyles),
      'Expected core src/system/styles.css or @reference-ui/react/styles.css after sync'
    ).toBe(true)
  })
})
