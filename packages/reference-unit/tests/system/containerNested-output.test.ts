import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

describe('nested container + multi-breakpoint r output (e2e)', () => {
  // MIGRATED: Covered by matrix/responsive/tests/unit/generated-output.test.ts.
  it.skip('copies the nested container fixture into virtual output', () => {
    expect(hasVirtualSystemFile('containerNested.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('containerNested.fixture.tsx')
    expect(content).toContain('<Div container>')
    expect(content).toContain('300: { padding:')
    expect(content).toContain('600: { padding:')
  })

  // MIGRATED: Covered by matrix/responsive/tests/e2e/system-contract.spec.ts
  // and matrix/responsive/tests/unit/generated-output.test.ts.
  it.skip('emits multiple anonymous @container rules for inner r breakpoints', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container (min-width: 300px)')
    expect(css).toContain('@container (min-width: 600px)')
    expect(css).toContain('padding: 0.5rem')
    expect(css).toContain('padding: 1.5rem')
  })
})
