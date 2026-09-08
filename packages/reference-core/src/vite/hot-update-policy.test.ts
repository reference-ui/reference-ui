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

  it('defers token, theme, and system source modules with touched Vite modules', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/src/core/theme/colors.ts', 1),
        createProjectPaths(),
      ),
    ).toBe(true)
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/src/system/tokens.ts', 1),
        createProjectPaths(),
      ),
    ).toBe(true)
  })

  it('does not defer story files, book app files, or standard component files', () => {
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/src/components/Button/Button.book.tsx', 1),
        createProjectPaths(),
      ),
    ).toBe(false)
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/book/app/BookShell.tsx', 1),
        createProjectPaths(),
      ),
    ).toBe(false)
    expect(
      shouldDeferHotUpdate(
        createHmrContext('/repo/src/components/Button/Button.tsx', 1),
        createProjectPaths(),
      ),
    ).toBe(false)
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
        createHmrContext('/repo/src/core/theme/colors.ts'),
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