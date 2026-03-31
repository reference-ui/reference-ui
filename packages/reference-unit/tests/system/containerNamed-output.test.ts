import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

describe('named container output (e2e)', () => {
  it('copies the source-backed named container fixture into virtual output', () => {
    expect(hasVirtualSystemFile('containerNamed.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('containerNamed.fixture.tsx')
    expect(content).toContain('container="shell"')
  })

  it('extracts named container query styles from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container shell (min-width: 777px)')
    expect(css).toContain('font-size: 1.125rem;')
    expect(css).not.toMatch(/@container\s+true\s+\(/)
  })
})
