import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

describe('named nested container output', () => {
  // TODO(matrix/responsive): Add one generated-output assertion that this
  // nested named fixture is mirrored into virtual output, then retire this smoke.
  it('copies the nested named container fixture into virtual output', () => {
    expect(hasVirtualSystemFile('containerNamedNested.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('containerNamedNested.fixture.tsx')
    expect(content).toContain('container="sidebar"')
    expect(content).toContain('400: { padding:')
  })

  // MIGRATED: Covered by matrix/responsive/tests/e2e/system-contract.spec.ts
  // and matrix/responsive/tests/unit/generated-output.test.ts.
  it.skip('emits @container sidebar (min-width: …) for named query across ancestors', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container sidebar (min-width: 400px)')
    expect(css).toContain('padding: 1rem')
    expect(css).toContain('font-size: 1.125rem')
  })

  // MIGRATED: Covered by matrix/responsive/tests/unit/generated-output.test.ts.
  it.skip('does not use anonymous @container for this fixture’s breakpoint key alone', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    // Other fixtures may add anonymous rules; ensure the nested named rule is present
    // and uses the sidebar name (not a typo like `@container true`).
    expect(css).not.toMatch(/@container\s+true\s+\(/)
  })
})
