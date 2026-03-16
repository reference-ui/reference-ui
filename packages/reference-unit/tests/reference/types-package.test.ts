import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createTastyApi } from '@reference-ui/rust/tasty'
import {
  installedTypesPackageDir,
  typesPackageDir,
  typesPackageJsonPath,
  waitForTypesPackage,
} from './helpers'

describe('@reference-ui/types package', () => {
  it('creates the generated package with manifest entry metadata', async () => {
    const ready = await waitForTypesPackage()
    expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)
    expect(existsSync(typesPackageDir), '.reference-ui/types should exist').toBe(true)
    expect(existsSync(typesPackageJsonPath), '.reference-ui/types/package.json should exist').toBe(true)

    const pkg = JSON.parse(readFileSync(typesPackageJsonPath, 'utf-8'))
    expect(pkg).toMatchObject({
      name: '@reference-ui/types',
      main: './tasty/manifest.js',
      types: './tasty/manifest.d.ts',
      exports: {
        '.': {
          import: './tasty/manifest.js',
          types: './tasty/manifest.d.ts',
        },
      },
    })
  })

  it('symlinks node_modules/@reference-ui/types to the generated package', async () => {
    const ready = await waitForTypesPackage()
    expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)

    expect(existsSync(installedTypesPackageDir), 'node_modules/@reference-ui/types should exist').toBe(true)
    expect(lstatSync(installedTypesPackageDir).isSymbolicLink()).toBe(true)
    expect(realpathSync(installedTypesPackageDir)).toBe(realpathSync(typesPackageDir))
  })

  it('resolves as a package and can load symbols through the Tasty API', async () => {
    const ready = await waitForTypesPackage()
    expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)

    const manifestPath = realpathSync(join(installedTypesPackageDir, 'tasty', 'manifest.js'))
    const pkg = await import('@reference-ui/types')
    const api = createTastyApi({ manifestPath })
    await api.ready()
    const fixture = await api.loadSymbolByName('ReferenceApiFixture')

    expect(pkg.default).toEqual(pkg.manifest)
    expect(fixture.getName()).toBe('ReferenceApiFixture')
    expect(fixture.getKind()).toBe('interface')
  })
})
