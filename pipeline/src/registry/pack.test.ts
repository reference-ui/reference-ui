import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { tarballContainsDeclaredPackagedPaths } from './pack.js'

describe('tarballContainsDeclaredPackagedPaths', () => {
  it('accepts tarballs that contain declared files and directories', () => {
    assert.equal(
      tarballContainsDeclaredPackagedPaths(
        [
          'package/package.json',
          'package/dist/index.mjs',
          'package/dist/index.d.ts',
          'package/dist/runtime/reference-ui/react/react.mjs',
        ],
        ['dist', 'dist/index.mjs'],
      ),
      true,
    )
  })

  it('rejects tarballs missing declared packaged outputs', () => {
    assert.equal(
      tarballContainsDeclaredPackagedPaths(
        [
          'package/package.json',
          'package/README.md',
          'package/.reference-ui/system/baseSystem.mjs',
        ],
        ['dist', 'dist/index.mjs'],
      ),
      false,
    )
  })
})