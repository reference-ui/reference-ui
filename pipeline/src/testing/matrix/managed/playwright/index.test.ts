import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createManagedPlaywrightConfigSource } from './index.js'

describe('managed Playwright config', () => {
  it('creates a Playwright config for only the active bundlers', () => {
    const config = createManagedPlaywrightConfigSource(['vite7'])

    assert.match(config, /This file is generated and managed by pipeline\./)
    assert.match(config, /name: 'vite7'/)
    assert.match(config, /pnpm exec vite --host 127\.0\.0\.1 --port 4173/)
    assert.doesNotMatch(config, /name: 'webpack5'/)
    assert.doesNotMatch(config, /webpack serve/)
  })
})