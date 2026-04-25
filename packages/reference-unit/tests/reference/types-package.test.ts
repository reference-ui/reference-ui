import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  createReferenceTestApi,
  installedTypesPackageDir,
  typesPackageDir,
  typesPackageJsonPath,
  waitForTypesPackage,
} from './helpers'

describe('@reference-ui/types package', () => {
  it('creates the generated package with a runtime entry plus manifest subpath exports', async () => {
    const ready = await waitForTypesPackage()
    expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)
    expect(existsSync(typesPackageDir), '.reference-ui/types should exist').toBe(true)
    expect(
      existsSync(typesPackageJsonPath),
      '.reference-ui/types/package.json should exist'
    ).toBe(true)

    const pkg = JSON.parse(readFileSync(typesPackageJsonPath, 'utf-8'))
    expect(pkg).toMatchObject({
      name: '@reference-ui/types',
      main: './types.mjs',
      types: './types.d.mts',
      exports: {
        '.': {
          import: './types.mjs',
          types: './types.d.mts',
        },
        './manifest': {
          import: './tasty/manifest.js',
          types: './tasty/manifest.d.ts',
        },
        './runtime': {
          import: './tasty/runtime.js',
          types: './tasty/runtime.d.ts',
        },
      },
    })
  })

  it('symlinks node_modules/@reference-ui/types to the generated package', async () => {
    const ready = await waitForTypesPackage()
    expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)

    expect(
      existsSync(installedTypesPackageDir),
      'node_modules/@reference-ui/types should exist'
    ).toBe(true)
    expect(lstatSync(installedTypesPackageDir).isSymbolicLink()).toBe(true)
    expect(realpathSync(installedTypesPackageDir)).toBe(realpathSync(typesPackageDir))
  })

  it('resolves as a package, exports Reference, and still exposes manifest metadata', async () => {
    const ready = await waitForTypesPackage()
    expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)

    const manifestPath = realpathSync(
      join(installedTypesPackageDir, 'tasty', 'manifest.js')
    )
    const pkg = await import('@reference-ui/types')
    const manifestModule = await import('@reference-ui/types/manifest')
    const api = createReferenceTestApi(manifestPath)
    await api.ready()
    const fixture = await api.loadSymbolByName('ReferenceApiFixture')
    const styleProps = await api.loadSymbolByName('StyleProps')
    const styleMembers = await styleProps.getDisplayMembers()

    expect(typeof pkg.Reference).toBe('function')
    expect(manifestModule.default).toEqual(manifestModule.manifest)
    expect(fixture.getName()).toBe('ReferenceApiFixture')
    expect(fixture.getKind()).toBe('interface')
    expect(styleProps.getName()).toBe('StyleProps')
    expect(styleProps.getKind()).toBe('typeAlias')
    expect(styleMembers.length).toBeGreaterThan(100)
  })
})
