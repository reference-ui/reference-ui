import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MANAGED_PLAYWRIGHT_IMAGE_DISTRO,
  MANAGED_PLAYWRIGHT_VERSION,
  managedPlaywrightContainerImage,
} from '../../../../../dependencies.js'
import { createManagedPlaywrightConfigSource } from './index.js'

describe('managed Playwright pin', () => {
  it('pins an exact Playwright version that matches the container image tag', () => {
    assert.match(MANAGED_PLAYWRIGHT_VERSION, /^\d+\.\d+\.\d+$/)
    assert.equal(
      managedPlaywrightContainerImage(),
      `mcr.microsoft.com/playwright:v${MANAGED_PLAYWRIGHT_VERSION}-${MANAGED_PLAYWRIGHT_IMAGE_DISTRO}`,
    )
  })
})

describe('managed Playwright config', () => {
  it('creates a Playwright config for only the active bundlers', () => {
    const config = createManagedPlaywrightConfigSource(['vite7'])

    assert.match(config, /This file is generated and managed by pipeline\./)
    assert.match(config, /name: 'vite7'/)
    assert.match(config, /pnpm exec vite --host 127\.0\.0\.1 --port 4173 --strictPort/)
    assert.match(config, /stdout: 'pipe'/)
    assert.match(config, /stderr: 'pipe'/)
    assert.doesNotMatch(config, /name: 'webpack5'/)
    assert.doesNotMatch(config, /webpack serve/)
  })
})
