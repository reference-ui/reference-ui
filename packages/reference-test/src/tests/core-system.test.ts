/**
 * Core system test - placeholder until we have our own orchestrator CLI.
 */

import { describe, it, beforeAll, afterAll } from 'vitest'
import { bootstrap } from '../environments/bootstrap.js'

describe('core-system', () => {
  let project: Awaited<ReturnType<typeof bootstrap>>

  beforeAll(async () => {
    project = await bootstrap()
  })

  afterAll(async () => {
    await project.cleanup()
  })

  it('ok', () => {
    // Stub: real tests will run via orchestrator CLI with logs
  })
})
