// Reference tasty scan-options suite: it takes a scratch project with a staged
// outDir and emits the scan-root pins — project root, config includes passed
// through untouched, the neo decl closure appended only when present. Pure
// options, no tasty build; the S5 probe proves the closure resolves for real.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { buildReferenceTastyScanOptions } from './tasty-build.ts'

const DECL_STYLE_PROPS = '.reference-ui/styled/types/style-props.d.ts'

let scratchDirs: string[] = []

function makeProject(withDecls: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), 'neo-tasty-scan-'))
  scratchDirs.push(dir)
  if (withDecls) {
    const typesDir = join(dir, '.reference-ui', 'styled', 'types')
    mkdirSync(typesDir, { recursive: true })
    // Staged but never rooted: index.d.ts exists in every real outDir, and the
    // closure must still ignore it (a rooted index would index a dup StyleProps).
    writeFileSync(join(typesDir, 'index.d.ts'), 'export type StyleProps = {}\n', 'utf-8')
    writeFileSync(
      join(typesDir, 'style-props.d.ts'),
      "import type { StyleProps } from './index.js'\nexport type SystemProperties = StyleProps\n",
      'utf-8'
    )
  }
  return dir
}

afterEach(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true })
  scratchDirs = []
})

describe('reference/bridge/tasty-build scan options', () => {
  it('scans the project root with config includes plus the neo decl closure', () => {
    const project = makeProject(true)

    const options = buildReferenceTastyScanOptions(project, ['src/**/*.{ts,tsx}'])

    expect(options.rootDir).toBe(project)
    expect(options.include).toEqual(['src/**/*.{ts,tsx}', '!node_modules/**', DECL_STYLE_PROPS])
  })

  it('passes config includes through with no decl roots when the outDir is absent', () => {
    const project = makeProject(false)

    const options = buildReferenceTastyScanOptions(project, ['src/**/*.{ts,tsx}'])

    expect(options.rootDir).toBe(project)
    expect(options.include).toEqual(['src/**/*.{ts,tsx}', '!node_modules/**'])
  })

  it('does not duplicate an author-supplied node_modules exclusion', () => {
    const project = makeProject(true)

    const options = buildReferenceTastyScanOptions(project, [
      'src/**/*.{ts,tsx}',
      '!node_modules/**',
    ])

    expect(options.include).toEqual(['src/**/*.{ts,tsx}', '!node_modules/**', DECL_STYLE_PROPS])
  })
})
