import type { HmrContext } from 'vite'
import { describe, expect, it } from 'vitest'
import { shouldDeferHotUpdate } from './hot-update-policy'
import type { ReferenceViteProjectPaths } from './types'

describe('shouldDeferHotUpdate', () => {
  it('defers managed generated outputs', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/.reference-ui/react/styles.css'),
        createProjectPaths(),
      ),
    ).toBe(true)
  })

  it('defers project source modules with touched Vite modules', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/src/cosmos/HmrSmoke.fixture.tsx', 1),
        createProjectPaths(),
      ),
    ).toBe(true)
  })

  it('does not defer files outside the project root', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/other/src/cosmos/HmrSmoke.fixture.tsx', 1),
        createProjectPaths(),
      ),
    ).toBe(false)
  })

  it('does not defer non-managed files inside the generated outDir', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/.reference-ui/cache/example.tsx', 1),
        createProjectPaths(),
      ),
    ).toBe(false)
  })

  it('does not defer node_modules files under the project root', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/node_modules/example/index.js', 1),
        createProjectPaths(),
      ),
    ).toBe(false)
  })

  it('does not defer project files without touched Vite modules', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/src/cosmos/HmrSmoke.fixture.tsx'),
        createProjectPaths(),
      ),
    ).toBe(false)
  })
})

function createProjectPaths(): ReferenceViteProjectPaths {
  return {
    projectRoot: '/repo',
    outDir: '/repo/.reference-ui',
    managedOutputRoots: new Set([
      '/repo/.reference-ui/react',
      '/repo/.reference-ui/styled',
      '/repo/.reference-ui/types',
      '/repo/.reference-ui/system',
      '/repo/.reference-ui/virtual',
    ]),
  }
}

function createHmrContext(file: string, moduleCount = 0): HmrContext {
  return {
    file,
    modules: Array.from({ length: moduleCount }, () => ({ url: file })),
  } as never as HmrContext
}