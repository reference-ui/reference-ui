/**
 * Core system test - thin wrapper.
 * Delegates to orchestrator.runMatrixTests(). Tests are environment-agnostic.
 */

import { describe, it } from 'vitest'
import { runMatrixTests } from '../orchestrator/index.js'

describe('core-system', () => {
  it('passes in all environments', async () => {
    await runMatrixTests()
  }, 120_000)
})
