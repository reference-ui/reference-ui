/**
 * Styletrace scenarios that are not case stations: repo-level fixtures and sync-root hints.
 * Station cases live under tests/cases and run through createStationSuite. This file keeps
 * the remaining traces that either point at workspace fixtures outside the module or
 * need two compile paths (nearest .reference-ui root versus an explicit hint).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { traceBindings } from '../js/index'
import {
  createNodeBuiltinHelperFixture,
  createReactReexportFixture,
  createSyncedWorkspaceFixture,
  traceDir,
  traceDirWithHint,
  traceDirWithoutHint,
  traceFixtureDir,
} from './helpers'

const TESTS_STYLETRACE_DIR = fileURLToPath(new URL('.', import.meta.url))

describe('styletrace fixtures', () => {
  it('ignores node builtin helper imports while tracing local wrappers', async () => {
    const fixture = await createNodeBuiltinHelperFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('traces local re-exports of @reference-ui/react', async () => {
    const fixture = await createReactReexportFixture()

    try {
      await expect(traceDir(fixture.rootDir)).resolves.toEqual(['AppCard', 'Div'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('resolves synced workspaces from the nearest .reference-ui root and accepts explicit sync root hints', async () => {
    const fixture = await createSyncedWorkspaceFixture()

    try {
      await expect(
        traceDirWithoutHint(`${fixture.rootDir}/consumer-app/src`)
      ).resolves.toEqual(['AppCard'])
      await expect(
        traceDirWithHint(`${fixture.rootDir}/consumer-app/src`, fixture.syncRootHint)
      ).resolves.toEqual(['AppCard'])
    } finally {
      await fixture.cleanup()
    }
  })

  it('keeps demo-ui out of the style-bearing surface', async () => {
    await expect(traceFixtureDir('fixtures/demo-ui/src')).resolves.toEqual([])
  })

  it('keeps extend-library out of the style-bearing surface', async () => {
    await expect(
      traceFixtureDir('fixtures/extend-library/src/components')
    ).resolves.toEqual([])
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
    await expect(
      traceFixtureDir('fixtures/atlas-project/src/components')
    ).resolves.toEqual([])
  })

  it('traces module-qualified bindings on committed sync-root fixture', async () => {
    const fixtureRoot = path.resolve(TESTS_STYLETRACE_DIR, '../fixtures/sync-root')
    const bindings = await traceBindings(path.join(fixtureRoot, 'src'), fixtureRoot)

    expect(bindings).toEqual(
      expect.arrayContaining([
        { module: 'DirectWrapper.tsx', name: 'DirectWrapper' },
        { module: 'ReexportedWrapper.tsx', name: 'ReexportedWrapper' },
        { module: 'index.ts', name: 'DirectWrapper' },
        { module: 'index.ts', name: 'ReexportedWrapper' },
      ])
    )

    const names = bindings.map(b => b.name)
    expect(names).not.toContain('StrippedWrapper')
    expect(names).not.toContain('UnrelatedComponent')
  })

  it('fails with explicit error when declaration root is missing', async () => {
    const fixtureRoot = path.resolve(TESTS_STYLETRACE_DIR, '../fixtures/sync-root')
    await expect(
      traceBindings(path.join(fixtureRoot, 'src'), '/nonexistent-decl-root-path')
    ).rejects.toThrow()
  })
})
