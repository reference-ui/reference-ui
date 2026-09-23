// Regression suite for the fragment bootstrap import map's react alias.
// It takes a scratch fragment importing the fixture shape (css plus Div and
// Span from @reference-ui/react) and emits the stub-clean pins: the alias
// resolves to the Neo react source entry, the production bundle path builds
// it with no require shims and no react-dom/client edge, and the bundle
// evaluates in Node ESM with the surface intact. The four styled ids stay
// absent by evaluated verdict, so the suite pins that too.

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { bundleFragments } from './runner.ts'
import { getFragmentBootstrapImportMap } from './bootstrap.ts'

const PROBE_KEY = '__neoBootstrapAliasProbe'

interface AliasProbe {
  css: string
  div: string
  span: string
  divName: string
  spanName: string
}

function readProbe(): AliasProbe | undefined {
  return (globalThis as unknown as Record<string, AliasProbe | undefined>)[PROBE_KEY]
}

function clearProbe(): void {
  delete (globalThis as unknown as Record<string, AliasProbe | undefined>)[PROBE_KEY]
}

let scratchRoot = mkdtempSync(join(tmpdir(), 'neo-bootstrap-alias-'))
let bundle = ''

async function buildProbeBundle(): Promise<string> {
  const probePath = join(scratchRoot, 'probe.ts')
  writeFileSync(
    probePath,
    `import { css, Div, Span } from '@reference-ui/react'\n` +
      `globalThis.__neoBootstrapAliasProbe = { css: typeof css, div: typeof Div, span: typeof Span, divName: Div.displayName, spanName: Span.displayName }\n`,
    'utf-8'
  )
  const bundles = await bundleFragments({
    files: [probePath],
    alias: getFragmentBootstrapImportMap(),
  })
  return bundles[0]?.bundle ?? ''
}

afterAll(() => {
  clearProbe()
  rmSync(scratchRoot, { recursive: true, force: true })
})

describe('fragment bootstrap import map', () => {
  it('aliases @reference-ui/react at the Neo react source entry', () => {
    const target = getFragmentBootstrapImportMap()['@reference-ui/react']
    expect(target).toBeDefined()
    expect(existsSync(target as string)).toBe(true)
    expect(basename(target as string)).toBe('react.ts')
  })

  it('carries none of the four styled ids', () => {
    const map = getFragmentBootstrapImportMap()
    expect(map).not.toHaveProperty('@reference-ui/styled/css')
    expect(map).not.toHaveProperty('@reference-ui/styled/css/cva')
    expect(map).not.toHaveProperty('@reference-ui/styled/jsx')
    expect(map).not.toHaveProperty('@reference-ui/styled/patterns/box')
  })

  it('bundles a react-importing fragment stub-clean through the production path', async () => {
    bundle = await buildProbeBundle()
    expect(bundle).toContain('"Div"')
    expect(bundle).not.toContain('require("react")')
    expect(bundle).not.toContain('react-dom/client')
  })

  it('evaluates the bundled fragment in Node ESM with the surface intact', async () => {
    if (bundle === '') bundle = await buildProbeBundle()
    const evalDir = join(scratchRoot, 'eval')
    mkdirSync(evalDir, { recursive: true })
    const evalPath = join(evalDir, 'probe.mjs')
    writeFileSync(evalPath, bundle, 'utf-8')
    try {
      await import(pathToFileURL(evalPath).href)
    } finally {
      rmSync(evalPath, { force: true })
    }
    expect(readProbe()).toEqual({
      css: 'function',
      div: 'function',
      span: 'function',
      divName: 'Div',
      spanName: 'Span',
    })
  })
})
