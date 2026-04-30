import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  createReferenceTestApi,
  installedTypesPackageDir,
  runRefCommand,
  typesPackageDir,
  typesPackageJsonPath,
  typesTastyDir,
  waitForReferenceArtifacts,
  waitForTypesPackage,
} from './helpers'

describe.sequential('reference output', () => {
  const getMemberName = (member: { getName(): string }) => member.getName()

  it(
    'emits Tasty artifacts and loads local plus projected symbols',
    async () => {
      const ready = await waitForReferenceArtifacts()
      expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
        true,
      )
      expect(existsSync(typesPackageDir), '.reference-ui/types should exist').toBe(true)
      expect(existsSync(typesTastyDir), '.reference-ui/types/tasty should exist').toBe(
        true,
      )

      const api = await createReferenceTestApi()
      await api.ready()

      const fixture = await api.loadSymbolByName('ReferenceApiFixture')
      const styleProps = await api.loadSymbolByName('StyleProps')
      const composed = await api.loadSymbolByName('DocsReferenceComposedButtonProps')
      const pinnedAlias = await api.loadSymbolByName('DocsReferencePinnedTargetAlias')

      expect(fixture.getKind()).toBe('interface')
      expect(fixture.getMembers().map(getMemberName)).toEqual([
        'label',
        'disabled',
        'variant',
      ])
      expect(styleProps.getKind()).toBe('typeAlias')
      expect((await styleProps.getDisplayMembers()).map(getMemberName)).toEqual(
        expect.arrayContaining(['accentColor', 'container']),
      )
      expect(composed.getKind()).toBe('typeAlias')
      expect((await composed.getDisplayMembers()).map(getMemberName)).toEqual(
        expect.arrayContaining([
          'label',
          'variant',
          'controlId',
          'interactionRole',
          'announceLabel',
        ]),
      )
      expect(pinnedAlias.getUnderlyingType()?.describe()).toBe('DocsReferencePinnedTarget')
    },
    30_000,
  )

  it(
    'creates the generated @reference-ui/types package with runtime and manifest exports',
    async () => {
      const ready = await waitForTypesPackage()
      expect(ready, '@reference-ui/types should be emitted by packager').toBe(true)
      expect(existsSync(typesPackageJsonPath)).toBe(true)

      const pkg = JSON.parse(readFileSync(typesPackageJsonPath, 'utf8'))

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

      expect(existsSync(installedTypesPackageDir)).toBe(true)
      expect(lstatSync(installedTypesPackageDir).isSymbolicLink()).toBe(true)
      expect(realpathSync(installedTypesPackageDir)).toBe(realpathSync(typesPackageDir))

      const generatedTypesModule = await import('@reference-ui/types')
      const manifestModule = await import('@reference-ui/types/manifest')

      expect(typeof generatedTypesModule.Reference).toBe('function')
      expect(manifestModule.default).toEqual(manifestModule.manifest)
    },
    30_000,
  )

  it(
    'refreshes generated reference artifacts after a source symbol rename',
    async () => {
      const fixturePath = join(
        process.cwd(),
        'src',
        'reference',
        'fixtures',
        'referenceRebuild.fixture.ts',
      )
      const originalSource = [
        'export interface ReferenceRebuildOriginalFixture {',
        '  label: string',
        '}',
        '',
      ].join('\n')
      const renamedSource = [
        'export interface ReferenceRebuildRenamedFixture {',
        '  label: string',
        '}',
        '',
      ].join('\n')
      let testError: unknown

      try {
        if (existsSync(fixturePath)) {
          unlinkSync(fixturePath)
        }

        writeFileSync(fixturePath, originalSource)
        runRefCommand('sync')

        let api = await createReferenceTestApi()
        await api.ready()

        const original = await api.loadSymbolByName('ReferenceRebuildOriginalFixture')
        expect(original.getKind()).toBe('interface')

        writeFileSync(fixturePath, renamedSource)
        runRefCommand('sync')

        api = await createReferenceTestApi()
        await api.ready()

        const renamed = await api.loadSymbolByName('ReferenceRebuildRenamedFixture')
        expect(renamed.getName()).toBe('ReferenceRebuildRenamedFixture')
        await expect(api.loadSymbolByName('ReferenceRebuildOriginalFixture')).rejects.toThrow()
      } catch (error) {
        testError = error
        throw error
      } finally {
        let cleanupError: unknown

        try {
          if (existsSync(fixturePath)) {
            unlinkSync(fixturePath)
            runRefCommand('sync')
          }
        } catch (error) {
          cleanupError = error
        }

        if (!testError && cleanupError) {
          throw cleanupError
        }
      }
    },
    90_000,
  )
})