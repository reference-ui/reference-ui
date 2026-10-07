import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { repoSourceExcludes } from './targets.js'

describe('repoSourceExcludes', () => {
  it('excludes host cargo target dirs and package build outputs at any depth', () => {
    // Regression guard for the matrix ENOSPC: packages/reference-rs/dist
    // holds the ~47G cargo target dir (dist/cargo/debug/incremental) and
    // must never ride the repo-root Dagger snapshot into the engine volume.
    const excludes: readonly string[] = repoSourceExcludes

    for (const pattern of ['**/target', '**/dist']) {
      assert.ok(excludes.includes(pattern), `expected repoSourceExcludes to contain '${pattern}'`)
    }
  })

  it('excludes repo-root scratch dirs the container build never reads', () => {
    const excludes: readonly string[] = repoSourceExcludes

    for (const pattern of ['.git', '.pipeline', '.complexity-temp', '.playwright-mcp', '.reference-ui']) {
      assert.ok(excludes.includes(pattern), `expected repoSourceExcludes to contain '${pattern}'`)
    }
  })
})
