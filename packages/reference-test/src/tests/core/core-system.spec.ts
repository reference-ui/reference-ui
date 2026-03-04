import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getSandboxDir } from '../../environments/lib/config.js'

test.describe('core-system', () => {
  test('ref sync produces expected artifacts', () => {
    const sandboxDir = getSandboxDir()
    const reactStyles = join(sandboxDir, 'node_modules/@reference-ui/react/styles.css')
    expect(existsSync(reactStyles), 'Expected @reference-ui/react/styles.css after sync').toBe(true)
  })
})
