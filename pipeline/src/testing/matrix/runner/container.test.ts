import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MANAGED_NODE_IMAGE,
  MANAGED_PLAYWRIGHT_VERSION,
  managedPlaywrightContainerImage,
} from '../../../../dependencies.js'
import { matrixContainerImage, parsePinnedPlaywrightVersion } from './container.js'
import type { FixtureSourceFiles } from './types.js'

function createFixtureSourceFiles(overrides?: Partial<FixtureSourceFiles>): FixtureSourceFiles {
  return {
    fixturePackageJson: {
      devDependencies: {},
      name: '@matrix/distro',
    },
    hasPlaywrightTests: false,
    hasVitestGlobalSetup: false,
    hasVitestTests: true,
    ...overrides,
  }
}

describe('matrix runner container helpers', () => {
  it('parses the pinned Playwright version from a range', () => {
    assert.equal(parsePinnedPlaywrightVersion('^1.55.0'), '1.55.0')
    assert.equal(parsePinnedPlaywrightVersion(undefined), MANAGED_PLAYWRIGHT_VERSION)
  })

  it('uses the node image for non-Playwright fixtures', () => {
    assert.equal(matrixContainerImage(createFixtureSourceFiles()), MANAGED_NODE_IMAGE)
  })

  it('uses the Playwright image for Playwright fixtures', () => {
    assert.equal(
      matrixContainerImage(createFixtureSourceFiles({
        fixturePackageJson: {
          devDependencies: {
            '@playwright/test': '1.55.0',
          },
          name: '@matrix/playwright',
        },
        hasPlaywrightTests: true,
      })),
      managedPlaywrightContainerImage('1.55.0'),
    )
  })
})