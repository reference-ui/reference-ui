import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

describe('font prop output (e2e)', () => {
  it('copies the source-backed font prop fixture into virtual output', () => {
    expect(hasVirtualSystemFile('fontProp.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('fontProp.fixture.tsx')
    expect(content).toContain('font="mono"')
    expect(content).toContain('weight="bold"')
  })

  it('extracts font custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('.ff_mono')
    expect(css).toContain('.ls_-0\\.04em')
    expect(css).toContain('.fw_700')
  })
})
