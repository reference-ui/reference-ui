import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveLocalReleasePlan } from './local.js'
import { pendingChangesetVersionMaterializationErrorMessage } from './plan.js'
import type { ReleasePlan } from './types.js'

describe('resolveLocalReleasePlan', () => {
  it('materializes release versions when pending changesets have not been applied yet', async () => {
    const expectedPlan: ReleasePlan = {
      needsRust: false,
      packages: [
        {
          dependencies: {},
          dir: '/repo/packages/reference-core',
          name: '@reference-ui/core',
          private: false,
          published: false,
          scripts: {},
          version: '0.0.2',
        },
      ],
    }
    let getReleasePlanCalls = 0
    let materializeCalls = 0

    const resolvedPlan = await resolveLocalReleasePlan({
      async getReleasePlan() {
        getReleasePlanCalls += 1

        if (getReleasePlanCalls === 1) {
          throw new Error(pendingChangesetVersionMaterializationErrorMessage)
        }

        return expectedPlan
      },
      async materializeReleaseVersions() {
        materializeCalls += 1
      },
    })

    assert.deepEqual(resolvedPlan, expectedPlan)
    assert.equal(getReleasePlanCalls, 2)
    assert.equal(materializeCalls, 1)
  })

  it('rethrows unrelated planning errors without materializing versions', async () => {
    let materializeCalls = 0

    await assert.rejects(
      () => resolveLocalReleasePlan({
        async getReleasePlan() {
          throw new Error('plan failed')
        },
        async materializeReleaseVersions() {
          materializeCalls += 1
        },
      }),
      /plan failed/,
    )

    assert.equal(materializeCalls, 0)
  })
})