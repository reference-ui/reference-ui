import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createManagedMatrixPackageJson } from '../managed/package-json/index.js'

describe('setupMatrixPackages package generation', () => {
  it('delegates package.json generation to the managed package-json module', () => {
    const packageJson = JSON.parse(createManagedMatrixPackageJson({ packageName: '@matrix/distro' })) as {
      name: string
      scripts: Record<string, string>
    }

    assert.equal(packageJson.name, '@matrix/distro')
    assert.equal(packageJson.scripts.setup, 'pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=@matrix/distro --sync')
    assert.deepEqual(Object.keys(packageJson.scripts).sort(), ['setup', 'sync', 'test'])
  })
})