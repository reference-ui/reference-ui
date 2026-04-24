import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { WorkspacePackage } from '../build/types.js'
import {
  assertLocalReleasePlanSupported,
  changesetsRequireVersionMaterialization,
  createReleasePlan,
  formatReleasePlan,
} from './plan.js'

function workspacePackage(overrides: Partial<WorkspacePackage> & Pick<WorkspacePackage, 'dir' | 'name' | 'version'>): WorkspacePackage {
  return {
    dependencies: {},
    private: false,
    scripts: {},
    ...overrides,
  }
}

describe('createReleasePlan', () => {
  it('sorts unpublished release packages in internal dependency order', () => {
    const plan = createReleasePlan(
      [
        {
          ...workspacePackage({
            dependencies: {
              '@reference-ui/core': '0.0.3',
            },
            dir: '/repo/packages/reference-lib',
            name: '@reference-ui/lib',
            version: '0.0.4',
          }),
          published: false,
        },
        {
          ...workspacePackage({
            dir: '/repo/packages/reference-core',
            name: '@reference-ui/core',
            version: '0.0.3',
          }),
          published: false,
        },
      ],
    )

    assert.equal(plan.needsRust, false)
    assert.deepEqual(
      plan.packages.map((pkg) => pkg.name),
      [
        '@reference-ui/core',
        '@reference-ui/lib',
      ],
    )
  })
})

describe('changesetsRequireVersionMaterialization', () => {
  it('detects mixed stale release states when pending changesets want newer versions', () => {
    const requiresMaterialization = changesetsRequireVersionMaterialization(
      {
        changesets: ['changeset'],
        releases: [
          {
            changesets: ['changeset'],
            name: '@reference-ui/lib',
            newVersion: '0.0.28',
            oldVersion: '0.0.27',
            type: 'patch',
          },
          {
            changesets: ['changeset'],
            name: '@reference-ui/rust',
            newVersion: '0.0.24',
            oldVersion: '0.0.23',
            type: 'patch',
          },
        ],
      },
      [
        workspacePackage({
          dir: '/repo/packages/reference-lib',
          name: '@reference-ui/lib',
          version: '0.0.28',
        }),
        workspacePackage({
          dir: '/repo/packages/reference-rs',
          name: '@reference-ui/rust',
          version: '0.0.23',
        }),
      ],
    )

    assert.equal(requiresMaterialization, true)
  })

  it('does not require materialization once workspace versions already match pending releases', () => {
    const requiresMaterialization = changesetsRequireVersionMaterialization(
      {
        changesets: ['changeset'],
        releases: [
          {
            changesets: ['changeset'],
            name: '@reference-ui/icons',
            newVersion: '0.0.25',
            oldVersion: '0.0.24',
            type: 'patch',
          },
          {
            changesets: ['changeset'],
            name: '@reference-ui/rust',
            newVersion: '0.0.24',
            oldVersion: '0.0.23',
            type: 'patch',
          },
        ],
      },
      [
        workspacePackage({
          dir: '/repo/packages/reference-icons',
          name: '@reference-ui/icons',
          version: '0.0.25',
        }),
        workspacePackage({
          dir: '/repo/packages/reference-rs',
          name: '@reference-ui/rust',
          version: '0.0.24',
        }),
      ],
    )

    assert.equal(requiresMaterialization, false)
  })
})

describe('assertLocalReleasePlanSupported', () => {
  it('fails when the local registry target set does not include a release package', () => {
    const releasePlan = createReleasePlan(
      [
        {
          ...workspacePackage({
            dir: '/repo/packages/reference-icons',
            name: '@reference-ui/icons',
            version: '0.0.1',
          }),
          published: false,
        },
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
        [
          {
            ...workspacePackage({
              dir: '/repo/packages/reference-rs',
              name: '@reference-ui/rust',
              version: '0.0.16',
            }),
            published: false,
          },
        ],
      ),
    )

    assert.match(output, /Release source: current workspace versions/)
    assert.match(output, /Rust release required: yes/)
    assert.match(output, /@reference-ui\/rust@0.0.16/)
  })
})