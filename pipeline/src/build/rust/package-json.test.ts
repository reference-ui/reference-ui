import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'

import {
  applyPreparedRustPackageOverride,
  mergeOptionalDependencyOverride,
} from './package-json.js'

describe('mergeOptionalDependencyOverride', () => {
  it('adds optionalDependencies when the package had none', () => {
    assert.deepEqual(
      mergeOptionalDependencyOverride(
        {
          name: '@reference-ui/rust',
          version: '0.0.15',
        },
        {
          optionalDependencies: {
            '@reference-ui/rust-darwin-arm64': '0.0.15',
          },
        },
      ),
      {
        name: '@reference-ui/rust',
        version: '0.0.15',
        optionalDependencies: {
          '@reference-ui/rust-darwin-arm64': '0.0.15',
        },
      },
    )
  })

  it('merges existing and generated optionalDependencies', () => {
    assert.deepEqual(
      mergeOptionalDependencyOverride(
        {
          name: '@reference-ui/rust',
          optionalDependencies: {
            '@reference-ui/rust-linux-x64-gnu': '0.0.15',
          },
        },
        {
          optionalDependencies: {
            '@reference-ui/rust-darwin-arm64': '0.0.15',
          },
        },
      ),
      {
        name: '@reference-ui/rust',
        optionalDependencies: {
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
          '@reference-ui/rust-darwin-arm64': '0.0.15',
        },
      },
    )
  })
})

describe('applyPreparedRustPackageOverride', () => {
  it('rewrites package.json when an override is present', async () => {
    const dir = await mkdtemp(resolve(tmpdir(), 'reference-ui-rust-package-json-'))

    try {
      const packageJsonPath = resolve(dir, 'package.json')
      await writeFile(
        packageJsonPath,
        `${JSON.stringify(
          {
            name: '@reference-ui/rust',
            optionalDependencies: {
              '@reference-ui/rust-linux-x64-gnu': '0.0.15',
            },
          },
          null,
          2,
        )}\n`,
      )

      await applyPreparedRustPackageOverride('@reference-ui/rust', dir, {
        generatedPackages: [],
        packageHashAugmentations: {},
        preparedPackageJsonOverrides: {
          '@reference-ui/rust': {
            optionalDependencies: {
              '@reference-ui/rust-darwin-arm64': '0.0.15',
            },
          },
        },
      })

      const updated = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
        optionalDependencies?: Record<string, string>
      }

      assert.deepEqual(updated.optionalDependencies, {
        '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        '@reference-ui/rust-darwin-arm64': '0.0.15',
      })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('leaves package.json untouched when no override exists for the package', async () => {
    const dir = await mkdtemp(resolve(tmpdir(), 'reference-ui-rust-package-json-'))

    try {
      const packageJsonPath = resolve(dir, 'package.json')
      const original = `${JSON.stringify(
        {
          name: '@reference-ui/rust',
          version: '0.0.15',
        },
        null,
        2,
      )}\n`
      await writeFile(packageJsonPath, original)

      await applyPreparedRustPackageOverride('@reference-ui/rust', dir, {
        generatedPackages: [],
        packageHashAugmentations: {},
        preparedPackageJsonOverrides: {},
      })

      assert.equal(await readFile(packageJsonPath, 'utf8'), original)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})