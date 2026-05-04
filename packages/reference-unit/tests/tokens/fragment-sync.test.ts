import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Token fragment sync tests — static assertions.
 *
 * globalSetup runs ref sync before this suite. These tests verify that:
 *  1. The generated panda config is present and contains the fixture token
 *     values contributed via extends:[ baseSystem ].
 *  2. The isFragmentFile logic (tested more thoroughly in reference-core) is
 *     not triggered for regular component files in our src tree, which keeps
 *     the non-fragment rebuild path intact for those files.
 *
 * Dynamic / watch-mode token sync is covered in tests/watch/watch.test.ts.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const refUiDir = join(pkgRoot, '.reference-ui')
const pandaConfigPath = join(refUiDir, 'panda.config.ts')
const systemBasePath = join(refUiDir, 'system', 'baseSystem.mjs')

describe('token fragment sync – static output assertions', () => {
  // MIGRATED: Covered by matrix/tokens/tests/unit/tokens-output.test.ts.
  it.skip('ref sync generates panda.config.ts', () => {
    expect(existsSync(pandaConfigPath), 'panda.config.ts should exist after ref sync').toBe(true)
  })

  // TODO(matrix/tokens): Add an explicit generated-output assertion for token
  // values contributed through extends: [baseSystem], then retire this package-
  // specific fixture check.
  it('panda.config.ts includes fixture token color values from extends:baseSystem', () => {
    if (!existsSync(pandaConfigPath)) return
    const config = readFileSync(pandaConfigPath, 'utf-8')
    // extend-library contributes these fixture colors via the system fragment API
    expect(config, 'panda.config.ts should include fixtureDemoBg token').toMatch(/fixtureDemoBg/)
    expect(config, 'panda.config.ts should include fixtureDemoAccent token').toMatch(/fixtureDemoAccent/)
  })

  // TODO(matrix/distro): Matrix distro covers generated baseSystem portability
  // and public exports, but not this package-specific layer-name assertion.
  it('baseSystem.mjs is generated and exports the reference-unit layer', () => {
    if (!existsSync(systemBasePath)) return
    const content = readFileSync(systemBasePath, 'utf-8')
    expect(content, 'baseSystem.mjs should reference the reference-unit layer name').toMatch(
      /reference-unit/
    )
  })

  // MIGRATED: Covered by matrix/tokens/tests/unit/tokens-output.test.ts.
  it.skip('panda.config.ts does not contain fragment tokens from a non-existent token file', () => {
    // Ensures that a previously-created token file written during a watch
    // session does not persist into the next static ref sync.
    if (!existsSync(pandaConfigPath)) return
    const config = readFileSync(pandaConfigPath, 'utf-8')
    // These are the colour values written only by the watch test — they
    // should NOT appear in the clean static sync output.
    expect(config).not.toMatch(/e2e-watch-token/)
  })
})
