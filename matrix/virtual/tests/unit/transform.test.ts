import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { srcDir, testsDir, virt } from './helpers'

describe('virtual transform contract', () => {
  const virtualSource = (...pathSegments: string[]) => virt('src', ...pathSegments)

  it('keeps src/index.tsx byte-identical when no transform fixture is present', () => {
    expect(existsSync(virtualSource('index.tsx'))).toBe(true)

    const source = readFileSync(join(srcDir, 'index.tsx'), 'utf-8')
    const virtual = readFileSync(virtualSource('index.tsx'), 'utf-8')

    expect(virtual).toBe(source)
  })

  it('keeps src/main.tsx byte-identical when no transform fixture is present', () => {
    expect(existsSync(virtualSource('main.tsx'))).toBe(true)

    const source = readFileSync(join(srcDir, 'main.tsx'), 'utf-8')
    const virtual = readFileSync(virtualSource('main.tsx'), 'utf-8')

    expect(virtual).toBe(source)
  })

  it('does not synthesize demo transform fixtures that are absent from this package', () => {
    expect(existsSync(virt('src', 'virtual', 'css.tsx'))).toBe(false)
    expect(existsSync(virt('src', 'virtual', 'recipes.tsx'))).toBe(false)
    expect(existsSync(virt('src', 'virtual', 'demo.jsx'))).toBe(false)

    const source = readFileSync(join(testsDir, 'unit', 'transform.test.ts'), 'utf-8')
    const virtual = readFileSync(virt('tests', 'unit', 'transform.test.ts'), 'utf-8')

    expect(virtual).toBe(source)
  })
})