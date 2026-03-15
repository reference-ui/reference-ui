import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

describe('anonymous container output (e2e)', () => {
  it('copies the source-backed anonymous container fixture into virtual output', () => {
    expect(hasVirtualSystemFile('containerAnonymous.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('containerAnonymous.fixture.tsx')
    expect(content).toContain("333: { padding: '1.25rem' }")
  })

  it('extracts anonymous container query styles from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container (min-width: 333px)')
    expect(css).toContain('padding: 1.25rem;')
    expect(css).not.toContain('@container true (min-width: 333px)')
  })
})
