import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

import { virt } from './helpers'

describe('virtual transforms', () => {
  const virtualSource = (...pathSegments: string[]) => virt('src', 'virtual', ...pathSegments)
  const expectedSystemRuntimeImport = "from 'src/system/runtime'"

  it('rewrites css() imports to system runtime', () => {
    expect(existsSync(virtualSource('css.tsx'))).toBe(true)

    const source = readFileSync(virtualSource('css.tsx'), 'utf-8')

    expect(source).toContain(expectedSystemRuntimeImport)
    expect(source).not.toContain("from '@reference-ui/react'")
  })

  it('rewrites recipe() imports to cva() from system runtime', () => {
    expect(existsSync(virtualSource('recipes.tsx'))).toBe(true)

    const source = readFileSync(virtualSource('recipes.tsx'), 'utf-8')

    expect(source).toContain(expectedSystemRuntimeImport)
    expect(source).toMatch(/import\s*\{\s*cva\s*\}\s*from/)
    expect(source).toContain('cva(')
    expect(source).not.toContain('recipe(')
    expect(source).not.toMatch(/import\s*\{\s*recipe\s*\}\s*from/)
  })

  it('transforms MDX sources to JSX', () => {
    expect(existsSync(virtualSource('demo.jsx'))).toBe(true)

    const source = readFileSync(virtualSource('demo.jsx'), 'utf-8')

    expect(source).toContain('Hello from MDX')
    expect(source).toMatch(/function|=>|<_components|MDXContent/)
  })
}