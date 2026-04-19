import { describe, expect, it } from 'vitest'
import { createPortableResetStylesheet } from './reset'

describe('system/css/reset', () => {
  it('scopes the same reset for portable downstream stylesheets', () => {
    const stylesheet = createPortableResetStylesheet('local-system')

    expect(stylesheet).toContain('@layer local-system {')
    expect(stylesheet).toContain('  @layer reset {')
    expect(stylesheet).toContain('    body {')
    expect(stylesheet).toContain('      container-type: inline-size;')
    expect(stylesheet).toContain('    html:focus-within {')
    expect(stylesheet).toContain('    @media (prefers-reduced-motion: reduce) {')
  })
})