/**
 * @vitest-environment happy-dom
 *
 * Verifies `layers: [baseSystem]` in an isolated downstream fixture:
 * - upstream CSS is appended to the consumer output
 * - upstream tokens stay out of the consumer Panda config
 * - primitives emit data-layer from ui.config.name (automatic layer identity)
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { colors } from '@reference-ui/lib/theme'
import { REFERENCE_UNIT_TOKEN_RGB } from '../../src/system/styles'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const fixtureRoot = resolve(pkgRoot, 'tests', 'fixtures', 'layers-isolation')
const fixtureOutDir = join(fixtureRoot, '.reference-ui')
const fixtureCssPath = join(fixtureOutDir, 'styled', 'styles.css')
const cssSnapshotDir = join(pkgRoot, 'tests', 'system', 'css_snapshot')
const cssSnapshotPath = join(cssSnapshotDir, 'layers-isolation.css')
const fixturePandaConfigPath = join(fixtureOutDir, 'panda.config.ts')
const fixtureReactBundlePath = join(fixtureOutDir, 'react', 'react.mjs')
const fixtureReactTypesPath = join(fixtureOutDir, 'react', 'react.d.mts')
const fixtureReactGeneratedTypesPath = join(
  fixtureOutDir,
  'react',
  'types.generated.d.mts'
)
const fixtureSystemTypesPath = join(fixtureOutDir, 'system', 'system.d.mts')
const fixtureSystemGeneratedTypesPath = join(
  fixtureOutDir,
  'system',
  'types.generated.d.mts'
)
const upstreamBaseSystemPath = join(pkgRoot, '.reference-ui', 'system', 'baseSystem.mjs')
const FIXTURE_ACCENT_RGB = 'rgb(17, 24, 39)'
const REACT_LAYER_PLACEHOLDER = '__REFERENCE_UI_LAYER_NAME__'
const refCore = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)

async function waitForFixtureOutputs(maxMs = 45_000): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    if (
      existsSync(fixtureCssPath) &&
      existsSync(fixturePandaConfigPath) &&
      existsSync(fixtureReactBundlePath) &&
      existsSync(fixtureReactTypesPath) &&
      existsSync(fixtureReactGeneratedTypesPath) &&
      existsSync(fixtureSystemTypesPath) &&
      existsSync(fixtureSystemGeneratedTypesPath)
    ) {
      const css = readFileSync(fixtureCssPath, 'utf-8')
      if (
        css.includes('[data-layer="layers-isolation"]') &&
        css.includes('[data-layer="reference-unit"]')
      ) {
        await new Promise(resolve => setTimeout(resolve, 150))
        return
      }
    }

    await new Promise(resolve => setTimeout(resolve, 80))
  }

  throw new Error(`Fixture sync did not produce layer-ready output within ${maxMs}ms`)
}

async function runFixtureSync(): Promise<void> {
  execSync(`node "${refCore}" clean`, {
    cwd: fixtureRoot,
    stdio: 'pipe',
    timeout: 15_000,
  })

  execSync(`node "${refCore}" sync`, {
    cwd: fixtureRoot,
    stdio: 'pipe',
    timeout: 60_000,
  })
  await waitForFixtureOutputs()
}

function injectFixtureCss(): string {
  const css = readFileSync(fixtureCssPath, 'utf-8')
  const style = document.createElement('style')
  style.setAttribute('data-test-injected', 'layers-isolation')
  style.textContent = css
  document.head.appendChild(style)
  return css
}

function snapshotFixtureCss(css: string): void {
  mkdirSync(cssSnapshotDir, { recursive: true })
  writeFileSync(cssSnapshotPath, css, 'utf-8')
}

describe('layers isolation fixture', () => {
  let fixtureCss = ''
  let pandaConfig = ''
  let fixtureReactBundle = ''
  let fixtureReactTypes = ''
  let fixtureReactGeneratedTypes = ''
  let fixtureSystemTypes = ''
  let fixtureSystemGeneratedTypes = ''

  beforeAll(async () => {
    if (!existsSync(upstreamBaseSystemPath)) {
      throw new Error(
        `Upstream baseSystem not found at ${upstreamBaseSystemPath}. The reference-unit global setup should run ref sync first.`
      )
    }

    await runFixtureSync()

    if (!existsSync(fixtureCssPath)) {
      throw new Error(`Fixture styles.css not found at ${fixtureCssPath}`)
    }

    if (!existsSync(fixturePandaConfigPath)) {
      throw new Error(`Fixture panda.config.ts not found at ${fixturePandaConfigPath}`)
    }

    fixtureCss = injectFixtureCss()
    snapshotFixtureCss(fixtureCss)
    pandaConfig = readFileSync(fixturePandaConfigPath, 'utf-8')
    fixtureReactBundle = readFileSync(fixtureReactBundlePath, 'utf-8')
    fixtureReactTypes = readFileSync(fixtureReactTypesPath, 'utf-8')
    fixtureReactGeneratedTypes = readFileSync(fixtureReactGeneratedTypesPath, 'utf-8')
    fixtureSystemTypes = readFileSync(fixtureSystemTypesPath, 'utf-8')
    fixtureSystemGeneratedTypes = readFileSync(fixtureSystemGeneratedTypesPath, 'utf-8')
  }, 75_000)

  it('keeps upstream tokens, fonts, and keyframes out of the consumer Panda config', () => {
    expect(pandaConfig).toContain('fixtureAccent')
    expect(pandaConfig).toContain(FIXTURE_ACCENT_RGB)
    expect(pandaConfig).not.toContain('referenceUnitToken')
    expect(pandaConfig).not.toContain('--colors-teal-500')
    expect(pandaConfig).not.toContain('fadeIn')
    expect(pandaConfig).not.toContain('mono')
  })

  it('appends upstream layer CSS, tokens, fonts, and keyframes', () => {
    expect(fixtureCss).toMatch(/@layer\s+layers-isolation\s*\{/)
    expect(fixtureCss).toMatch(/@layer\s+reference-unit\s*\{/)
    expect(fixtureCss).toMatch(/\[data-layer="reference-unit"\]\s*\{/)
    expect(fixtureCss).toContain(
      `--colors-reference-unit-token: ${REFERENCE_UNIT_TOKEN_RGB};`
    )
    expect(fixtureCss).toContain(`--colors-teal-500: ${colors.teal[500].value};`)
    expect(fixtureCss).toContain(`--colors-fixture-accent: ${FIXTURE_ACCENT_RGB};`)
    expect(fixtureCss).toContain('@font-face')
    expect(fixtureCss).toContain('fadeIn')
  })

  it('writes a CSS snapshot for fast layer inspection', () => {
    expect(existsSync(cssSnapshotPath)).toBe(true)
    expect(readFileSync(cssSnapshotPath, 'utf-8')).toBe(fixtureCss)
  })

  it('keeps upstream font registries out of consumer generated types', () => {
    expect(fixtureReactTypes).toContain('interface ReferenceFontRegistry')
    expect(fixtureSystemTypes).toContain('interface ReferenceFontRegistry')

    expect(fixtureReactGeneratedTypes).not.toContain('"mono": {')
    expect(fixtureReactGeneratedTypes).not.toContain('"sans": {')
    expect(fixtureReactGeneratedTypes).not.toContain('"serif": {')
    expect(fixtureSystemGeneratedTypes).not.toContain('"mono": {')
    expect(fixtureSystemGeneratedTypes).not.toContain('"sans": {')
    expect(fixtureSystemGeneratedTypes).not.toContain('"serif": {')
  })

  it('injects the fixture runtime with the local ui.config.name', () => {
    expect(fixtureReactBundle).toContain('layers-isolation')
    expect(fixtureReactBundle).not.toContain(REACT_LAYER_PLACEHOLDER)
  })

  it('emits data-layer from config name and consumer tokens resolve', () => {
    render(
      <>
        <Div data-testid="fixture-scope" padding="1rem">
          <Div
            data-testid="fixture-target"
            color="var(--colors-fixture-accent)"
            padding="var(--spacing-1r)"
          >
            Consumer layer target
          </Div>
        </Div>
      </>
    )

    const scope = screen.getByTestId('fixture-scope')
    const target = screen.getByTestId('fixture-target')

    // Test runs in reference-unit; Div comes from reference-unit's bundle, so data-layer is reference-unit.
    expect(scope.getAttribute('data-layer')).toBe('reference-unit')

    expect(target).toBeInTheDocument()
  })
})
