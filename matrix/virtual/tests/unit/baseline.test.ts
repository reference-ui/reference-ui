import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  getReferenceBrowserSourcePaths,
  getVirtualPaths,
  srcDir,
  testsDir,
  virt,
  virtualDir,
} from './helpers'

describe('virtual baseline', () => {
  it('creates .reference-ui/virtual with files matching include', () => {
    expect(existsSync(virtualDir)).toBe(true)
    expect(existsSync(virt('_reference-component', 'Reference.tsx'))).toBe(true)
    expect(existsSync(virt('_reference-component', 'Runtime.ts'))).toBe(true)
    expect(existsSync(virt('_reference-component', 'components', 'index.ts'))).toBe(true)
    expect(existsSync(virt('src', 'index.tsx'))).toBe(true)
    expect(existsSync(virt('src', 'main.tsx'))).toBe(true)
    expect(existsSync(virt('tests', 'unit', 'baseline.test.ts'))).toBe(true)

    const srcIndex = readFileSync(join(srcDir, 'index.tsx'), 'utf-8')
    const virtualIndex = readFileSync(virt('src', 'index.tsx'), 'utf-8')
    expect(virtualIndex).toBe(srcIndex)

    const sourceBaseline = readFileSync(join(testsDir, 'unit', 'baseline.test.ts'), 'utf-8')
    const virtualBaseline = readFileSync(virt('tests', 'unit', 'baseline.test.ts'), 'utf-8')
    expect(virtualBaseline).toBe(sourceBaseline)
  })

  it('mirrors the current reference browser component files', () => {
    const expected = getReferenceBrowserSourcePaths()
    const actual = getVirtualPaths()
      .filter((path) => path.startsWith('_reference-component/'))
      .map((path) => path.slice('_reference-component/'.length))
      .sort((left, right) => left.localeCompare(right))

    expect(actual).toEqual(expected)
  })

  it('excludes node_modules and .reference-ui from virtual copy', () => {
    expect(existsSync(join(virtualDir, 'node_modules'))).toBe(false)
    expect(existsSync(join(virtualDir, '.reference-ui', 'cache'))).toBe(false)
  })

  it('does not copy files outside include patterns', () => {
    expect(existsSync(join(virtualDir, 'ui.config.ts'))).toBe(false)
    expect(existsSync(join(virtualDir, 'vite.config.ts'))).toBe(false)
  })
}