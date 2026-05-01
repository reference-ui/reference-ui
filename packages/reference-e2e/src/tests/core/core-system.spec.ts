import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getSandboxDir } from '../../environments/lib/config'

test.describe('core-system', () => {
  // TODO(matrix/system): Add an explicit @reference-ui/react/styles.css existence
  // smoke to matrix/system (or decide the broader generated-output coverage is
  // sufficient), then retire this legacy case.
  test('ref sync produces expected artifacts', () => {
    const sandboxDir = getSandboxDir()
    const reactStyles = join(sandboxDir, 'node_modules/@reference-ui/react/styles.css')
    expect(existsSync(reactStyles), 'Expected @reference-ui/react/styles.css after sync').toBe(true)
  })
})
