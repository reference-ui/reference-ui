/**
 * Core system test - runs ref sync and build in sandbox.
 * Runs for each Vitest project (react17-vite, react18-vite, react19-vite).
 */

import { describe, it, expect } from 'vitest'
import { getProject } from '../lib/project.js'
import { Runner } from '../lib/runner.js'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('core-system', () => {
  it('ref sync works', async () => {
    const project = getProject()
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
