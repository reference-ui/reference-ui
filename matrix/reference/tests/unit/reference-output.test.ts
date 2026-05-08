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
  const isVariantMember = (member: {
    getName(): string
    getType(): { describe(): string } | undefined
  }): boolean => member.getName() === 'variant'

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
    'keeps indexed-access aliases and projected fixture members readable in the raw Tasty API',
    async () => {
      const ready = await waitForReferenceArtifacts()
      expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
        true,
      )

      const api = await createReferenceTestApi()
      await api.ready()

      const fixture = await api.loadSymbolByName('ReferenceApiFixture')
      const variant = await api.loadSymbolByName('ReferenceApiVariant')
      const members = fixture.getMembers()
      const variantMember = members.find(isVariantMember)
      const variantAliasRaw = variant.getUnderlyingType()?.getRaw() as {
        kind?: string
        object?: { name?: string }
        index?: { kind?: string; value?: string }
      }

      expect(fixture.getKind()).toBe('interface')
      expect(members.map(getMemberName)).toEqual(['label', 'disabled', 'variant'])
      expect(variant.getKind()).toBe('typeAlias')
      expect(variantAliasRaw.kind).toBe('indexed_access')
      expect(variantAliasRaw.object?.name).toBe('ReferenceApiFixture')
      expect(variantAliasRaw.index?.kind).toBe('literal')
      expect(variantAliasRaw.index?.value).toBe("'variant'")
      expect(variantMember?.getType()?.describe()).toContain('solid')
      expect(variantMember?.getType()?.describe()).toContain('ghost')
    },
    30_000,
  )

  it(
    'indexes public StyleProps and local extending fixtures through display members',
    async () => {
      const ready = await waitForReferenceArtifacts()
      expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
        true,
      )

      const api = await createReferenceTestApi()
      await api.ready()

      const styleProps = await api.loadSymbolByName('StyleProps')
      const extended = await api.loadSymbolByName('ReferenceStylePropsExtendsFixture')
      const extendedAlias = await api.loadSymbolByName('ReferenceStylePropsTypeExtendsFixture')
      const fixture = await api.loadSymbolByName('ReferenceApiFixture')
      const styleMembers = await styleProps.getDisplayMembers()
      const extendedMembers = await extended.getDisplayMembers()
      const extendedAliasMembers = await extendedAlias.getDisplayMembers()

      expect(styleProps.getName()).toBe('StyleProps')
      expect(styleProps.getKind()).toBe('typeAlias')
      expect(styleMembers.length).toBeGreaterThan(100)
      expect(styleMembers.map(getMemberName)).toEqual(
        expect.arrayContaining(['WebkitAppearance', 'accentColor', 'container']),
      )
      expect(extendedMembers.length).toBeGreaterThan(100)
      expect(extendedMembers.map(getMemberName)).toEqual(
        expect.arrayContaining(['WebkitAppearance', 'container', 'localTone']),
      )
      expect(extendedAliasMembers.length).toBeGreaterThan(100)
      expect(extendedAliasMembers.map(getMemberName)).toEqual(
        expect.arrayContaining(['WebkitAppearance', 'container', 'localFlag', 'localTone']),
      )
      expect(fixture.getName()).toBe('ReferenceApiFixture')
      expect(fixture.getKind()).toBe('interface')
    },
    30_000,
  )

  it(
    'flattens inherited display members when an interface extends a type alias',
    async () => {
      const ready = await waitForReferenceArtifacts()
      expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
        true,
      )

      const api = await createReferenceTestApi()
      await api.ready()

      const symbol = await api.loadSymbolByName('DocsReferenceTypeExtendsProps')
      const displayMembers = await symbol.getDisplayMembers()

      expect(symbol.getKind()).toBe('interface')
      expect(displayMembers.map(getMemberName)).toEqual(
        expect.arrayContaining(['label', 'size', 'tone', 'hasMenu']),
      )
    },
    30_000,
  )

  it(
    'projects direct alias targets in the raw Tasty API without losing alias identity',
    async () => {
      const ready = await waitForReferenceArtifacts()
      expect(ready, 'reference manifest should be emitted by the reference worker').toBe(
        true,
      )

      const api = await createReferenceTestApi()
      await api.ready()

      const alias = await api.loadSymbolByName('DocsReferencePinnedTargetAlias')
      const displayMembers = await alias.getDisplayMembers()

      expect(alias.getKind()).toBe('typeAlias')
      expect(alias.getUnderlyingType()?.describe()).toBe('DocsReferencePinnedTarget')
      expect(displayMembers.map(getMemberName)).toEqual(['label', 'disabled'])
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