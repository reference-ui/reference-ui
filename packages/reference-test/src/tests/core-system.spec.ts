import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getSandboxDir(): string {
  const project = process.env.REF_TEST_PROJECT
  if (!project) throw new Error('REF_TEST_PROJECT required (set by run-matrix.ts)')
  return join(__dirname, '..', '..', '.sandbox', project)
}

test.describe('core-system', () => {
  test('ref sync produces expected artifacts', () => {
    const sandboxDir = getSandboxDir()
    const reactStyles = join(sandboxDir, 'node_modules/@reference-ui/react/styles.css')
    expect(existsSync(reactStyles), 'Expected @reference-ui/react/styles.css after sync').toBe(true)
  })
})
