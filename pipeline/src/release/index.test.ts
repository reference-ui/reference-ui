import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { WorkspacePackage } from '../build/types.js'
import {
  assertLocalReleasePlanSupported,
  createReleasePlan,
  formatReleasePlan,
  parseChangesetStatus,
} from './index.js'

function workspacePackage(overrides: Partial<WorkspacePackage> & Pick<WorkspacePackage, 'dir' | 'name' | 'version'>): WorkspacePackage {
  return {
    dependencies: {},
    private: false,
    scripts: {},
    ...overrides,
  }
}

describe('parseChangesetStatus', () => {
  it('keeps only releases with package names and string changeset ids', () => {
    assert.deepEqual(
      parseChangesetStatus({
        changesets: ['alpha', { id: 'ignored' }],
        releases: [
          {
            changesets: ['alpha', 42],
            name: '@reference-ui/core',
            newVersion: '0.0.2',
            oldVersion: '0.0.1',
            type: 'patch',
          },
          {
            type: 'minor',
          },
        ],
      }),
      {
        changesets: ['alpha'],
        releases: [
          {
            changesets: ['alpha'],
            name: '@reference-ui/core',
            newVersion: '0.0.2',
            oldVersion: '0.0.1',
            type: 'patch',
          },
        ],
      },
    )
  })
})

describe('createReleasePlan', () => {
  it('sorts release packages in internal dependency order', () => {
    const plan = createReleasePlan(
      {
        changesets: ['blue-mouse'],
        releases: [
          {
            changesets: ['blue-mouse'],
            name: '@reference-ui/lib',
            newVersion: '0.0.3',
            oldVersion: '0.0.2',
            type: 'minor',
          },
          {
            changesets: ['blue-mouse'],
            name: '@reference-ui/core',
            newVersion: '0.0.2',
            oldVersion: '0.0.1',
            type: 'patch',
          },
        ],
      },
      [
        workspacePackage({
          dependencies: {
            '@reference-ui/core': '0.0.1',
          },
          dir: '/repo/packages/reference-lib',
          name: '@reference-ui/lib',
          version: '0.0.2',
        }),
        workspacePackage({
          dir: '/repo/packages/reference-core',
          name: '@reference-ui/core',
          version: '0.0.1',
        }),
      ],
    )

    assert.equal(plan.changesetCount, 1)
    assert.equal(plan.needsRust, false)
    assert.deepEqual(
      plan.packages.map((pkg) => ({
        name: pkg.name,
        nextVersion: pkg.nextVersion,
      })),
      [
        {
          name: '@reference-ui/core',
          nextVersion: '0.0.2',
        },
        {
          name: '@reference-ui/lib',
          nextVersion: '0.0.3',
        },
      ],
    )
  })

  it('fails when changesets references a package outside the public workspace set', () => {
    assert.throws(
      () => createReleasePlan({ changesets: ['alpha'], releases: [{ changesets: [], name: '@reference-ui/missing' }] }, []),
      /@reference-ui\/missing/,
    )
  })
})

describe('assertLocalReleasePlanSupported', () => {
  it('fails when the local registry target set does not include a release package', () => {
    const releasePlan = createReleasePlan(
      {
        changesets: ['alpha'],
        releases: [
          {
            changesets: ['alpha'],
            name: '@reference-ui/icons',
            newVersion: '0.0.2',
          },
        ],
      },
      [
        workspacePackage({
          dir: '/repo/packages/reference-icons',
          name: '@reference-ui/icons',
          version: '0.0.1',
        }),
      ],
    )

    assert.throws(
      () => assertLocalReleasePlanSupported(releasePlan, new Set(['@reference-ui/core'])),
      /@reference-ui\/icons/,
    )
  })
})

describe('formatReleasePlan', () => {
  it('formats a readable release summary', () => {
    const output = formatReleasePlan(
      createReleasePlan(
        {
          changesets: ['alpha'],
          releases: [
            {
              changesets: ['alpha'],
              name: '@reference-ui/rust',
              newVersion: '0.0.17',
              oldVersion: '0.0.16',
              type: 'patch',
            },
          ],
        },
        [
          workspacePackage({
            dir: '/repo/packages/reference-rs',
            name: '@reference-ui/rust',
            version: '0.0.16',
          }),
        ],
      ),
    )

    assert.match(output, /Rust release required: yes/)
    assert.match(output, /@reference-ui\/rust 0.0.16 -> 0.0.17 \(patch\)/)
  })
})