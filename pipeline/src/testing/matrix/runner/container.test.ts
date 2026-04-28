import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { matrixContainerImage, parsePinnedPlaywrightVersion } from './container.js'
import type { FixtureSourceFiles } from './types.js'

function createFixtureSourceFiles(overrides?: Partial<FixtureSourceFiles>): FixtureSourceFiles {
  return {
    fixturePackageJson: {
      devDependencies: {},
      name: '@matrix/distro',
    },
    hasPlaywrightTests: false,
    hasVitestTests: true,
    ...overrides,
  }
}

describe('matrix runner container helpers', () => {
  it('parses the pinned Playwright version from a range', () => {
    assert.equal(parsePinnedPlaywrightVersion('^1.55.0'), '1.55.0')
    assert.equal(parsePinnedPlaywrightVersion(undefined), '1.48.0')
  })

  it('uses the node image for non-Playwright fixtures', () => {
    assert.equal(matrixContainerImage(createFixtureSourceFiles()), 'node:24-bookworm')
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
      'mcr.microsoft.com/playwright:v1.55.0-jammy',
    )
  })
})