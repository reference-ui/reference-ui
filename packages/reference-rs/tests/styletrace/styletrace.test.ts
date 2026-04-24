import { describe, expect, it } from 'vitest'

import {
  createDefaultExportPackageFixture,
  createExportStarPackageFixture,
  createNodeBuiltinHelperFixture,
  createNodeModulesWrapperFixture,
  createSubpathPackageFixture,
  createVendoredWorkspaceFixture,
  traceCase,
  traceDir,
  traceDirWithHint,
  traceFixtureDir,
} from './helpers'

describe('styletrace', () => {
  it('finds direct primitive wrappers with public style props', async () => {
    await expect(traceCase('direct_wrapper')).resolves.toEqual(['Card'])
  })

  it('propagates style-bearing links through wrapper chains', async () => {
    await expect(traceCase('wrapper_chain')).resolves.toEqual(['Card', 'Surface'])
  })

  it('returns exported alias names for traced wrappers', async () => {
    await expect(traceCase('reexport_alias')).resolves.toEqual(['Panel'])
  })

  it('traces export-star barrels', async () => {
    await expect(traceCase('export_star_barrel')).resolves.toEqual(['Card'])
  })

  it('ignores components that render primitives without exposing style props', async () => {
    await expect(traceCase('negative')).resolves.toEqual([])
  })

  it('traces wrappers that forward rest style props', async () => {
    await expect(traceCase('rest_spread_wrapper')).resolves.toEqual(['Card'])
  })

  it('traces forwardRef wrappers with style-prop generics', async () => {
    await expect(traceCase('forward_ref_wrapper')).resolves.toEqual(['Card'])
  })

  it('traces namespace import wrappers', async () => {
    await expect(traceCase('namespace_import')).resolves.toEqual(['Card'])
  })

  it('traces components that use the Reference style pipeline without primitives', async () => {
    await expect(traceCase('direct_style_pipeline')).resolves.toEqual(['Panel'])
  })

  it('traces factory-generated icons and wrappers', async () => {
    await expect(traceCase('icon_factory')).resolves.toEqual(['StarIcon', 'ToolbarIcon'])
  })

  it('traces exported wrappers that forward into node_modules packages', async () => {
    const fixture = await createNodeModulesWrapperFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard', 'PackageCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('traces wrappers that import default-export package components', async () => {
    const fixture = await createDefaultExportPackageFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard', 'PackageCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('traces wrappers that import package subpath components', async () => {
    const fixture = await createSubpathPackageFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard', 'PackageCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('traces wrappers that import package barrel export-star components', async () => {
    const fixture = await createExportStarPackageFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard', 'PackageCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('ignores node builtin helper imports while tracing local wrappers', async () => {
    const fixture = await createNodeBuiltinHelperFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('resolves vendored Reference workspaces only when the caller passes a workspace hint', async () => {
    const fixture = await createVendoredWorkspaceFixture()

    try {
      await expect(traceDir(`${fixture.rootDir}/consumer-app/src`)).rejects.toThrow(
        /could not resolve workspace root/i,
      )
      await expect(
        traceDirWithHint(`${fixture.rootDir}/consumer-app/src`, fixture.workspaceHint),
      ).resolves.toEqual(['AppCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('keeps demo-ui out of the style-bearing surface', async () => {
    await expect(traceFixtureDir('fixtures/demo-ui/src')).resolves.toEqual([])
  })

  it('keeps extend-library out of the style-bearing surface', async () => {
    await expect(traceFixtureDir('fixtures/extend-library/src/components')).resolves.toEqual([])
  })

  it('finds wrapped Reference primitive exports in a workspace fixture library', async () => {
    await expect(traceFixtureDir('fixtures/styletrace-library/src')).resolves.toEqual([
      'MyStyleComponent',
    ])
  })

  it('traces wrapped Reference primitive exports through a fixture consumer import', async () => {
    await expect(traceFixtureDir('fixtures/styletrace-consumer/src')).resolves.toEqual([
      'ConsumerStyleComponent',
      'MyStyleComponent',
    ])
  })

  it('keeps atlas-project component wrappers out of the style-bearing surface', async () => {
    await expect(traceFixtureDir('fixtures/atlas-project/src/components')).resolves.toEqual([])
  })
})