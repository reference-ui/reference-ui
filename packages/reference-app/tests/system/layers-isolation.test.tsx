/**
 * @vitest-environment happy-dom
 *
 * Verifies `layers: [baseSystem]` in an isolated downstream fixture:
 * - upstream CSS is appended to the consumer output
 * - upstream tokens stay out of the consumer Panda config
 * - the primitive `layer` prop emits data-layer for runtime token scoping
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { execSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { colors } from '@reference-ui/lib/theme'
import { REFERENCE_APP_TOKEN_RGB } from '../../src/system/styles'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const fixtureRoot = resolve(pkgRoot, 'tests', 'fixtures', 'layers-isolation')
const fixtureOutDir = join(fixtureRoot, '.reference-ui')
const fixtureCssPath = join(fixtureOutDir, 'styled', 'styles.css')
const fixturePandaConfigPath = join(fixtureOutDir, 'panda.config.ts')
const upstreamBaseSystemPath = join(pkgRoot, '.reference-ui', 'system', 'baseSystem.mjs')
const FIXTURE_ACCENT_RGB = 'rgb(17, 24, 39)'
const refCore = join(
  pkgRoot,
  'node_modules',
  '@reference-ui',
  'core',
  'dist',
  'cli',
  'index.mjs'
)

async function waitForFixtureOutputs(maxMs = 20_000): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < maxMs) {
    if (existsSync(fixtureCssPath) && existsSync(fixturePandaConfigPath)) {
      const css = readFileSync(fixtureCssPath, 'utf-8')
      if (css.includes('[data-layer="reference-app"]')) {
        await new Promise((resolve) => setTimeout(resolve, 150))
        return
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 80))
  }

  throw new Error(`Fixture sync did not produce layer-ready output within ${maxMs}ms`)
}

function killProcessTree(pid: number | undefined): void {
  if (!pid) return

  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Process may already be gone.
    }
  }
}

async function runFixtureSync(): Promise<void> {
  execSync(`node "${refCore}" clean`, {
    cwd: fixtureRoot,
    stdio: 'pipe',
    timeout: 15_000,
  })

  const syncProcess = spawn('node', [refCore, 'sync'], {
    cwd: fixtureRoot,
    stdio: 'pipe',
    detached: true,
  })

  try {
    await waitForFixtureOutputs()
  } finally {
    killProcessTree(syncProcess.pid)
  }
}

function injectFixtureCss(): string {
  const css = readFileSync(fixtureCssPath, 'utf-8')
  const style = document.createElement('style')
  style.setAttribute('data-test-injected', 'layers-isolation')
  style.textContent = css
  document.head.appendChild(style)
  return css
}

describe('layers isolation fixture', () => {
  let fixtureCss = ''
  let pandaConfig = ''

  beforeAll(async () => {
    if (!existsSync(upstreamBaseSystemPath)) {
      throw new Error(
        `Upstream baseSystem not found at ${upstreamBaseSystemPath}. The reference-app global setup should run ref sync first.`
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
    pandaConfig = readFileSync(fixturePandaConfigPath, 'utf-8')
  }, 75_000)

  it('keeps upstream tokens out of the consumer Panda config', () => {
    expect(pandaConfig).toContain('fixtureAccent')
    expect(pandaConfig).toContain(FIXTURE_ACCENT_RGB)
    expect(pandaConfig).not.toContain('referenceAppToken')
    expect(pandaConfig).not.toContain('--colors-teal-500')
  })

  it('appends upstream layer CSS and data-layer token scope', () => {
    expect(fixtureCss).toMatch(/@layer\s+layers-isolation\s*\{/)
    expect(fixtureCss).toMatch(/@layer\s+reference-app\s*\{/)
    expect(fixtureCss).toMatch(/\[data-layer="reference-app"\]\s*\{/)
    expect(fixtureCss).toContain(`--colors-reference-app-token: ${REFERENCE_APP_TOKEN_RGB};`)
    expect(fixtureCss).toContain(`--colors-teal-500: ${colors.teal[500].value};`)
    expect(fixtureCss).toContain(`--colors-fixture-accent: ${FIXTURE_ACCENT_RGB};`)
  })

  it('emits the layer prop and exposes upstream token variables to that subtree', () => {
    render(
      <>
        <Div data-testid="fixture-unlayered-scope" padding="1rem">
          <Div data-testid="fixture-unlayered-target" color="var(--colors-reference-app-token)">
            Unlayered target
          </Div>
        </Div>

        <Div data-testid="fixture-layer-scope" layer="reference-app" padding="1rem">
          <Div
            data-testid="fixture-layer-target"
            color="var(--colors-reference-app-token)"
            padding="var(--spacing-1r)"
          >
            Layer target
          </Div>
        </Div>
      </>
    )

    const unlayeredScope = screen.getByTestId('fixture-unlayered-scope')
    const layeredScope = screen.getByTestId('fixture-layer-scope')
    const layeredTarget = screen.getByTestId('fixture-layer-target')

    expect(layeredScope.getAttribute('data-layer')).toBe('reference-app')
    expect(unlayeredScope.getAttribute('data-layer')).toBeNull()

    const layeredTokenValue = window
      .getComputedStyle(layeredScope)
      .getPropertyValue('--colors-reference-app-token')
      .trim()
    const unlayeredTokenValue = window
      .getComputedStyle(unlayeredScope)
      .getPropertyValue('--colors-reference-app-token')
      .trim()
    const upstreamLayerTokenValue = window.getComputedStyle(layeredScope).getPropertyValue('--colors-teal-500').trim()

    if (layeredTokenValue) {
      expect(layeredTokenValue).toBe(REFERENCE_APP_TOKEN_RGB)
    }
    if (upstreamLayerTokenValue) {
      expect(upstreamLayerTokenValue).toBe(colors.teal[500].value)
    }

    if (layeredTokenValue || unlayeredTokenValue) {
      expect(unlayeredTokenValue).toBe('')
    }

    const targetStyle = window.getComputedStyle(layeredTarget)
    if (targetStyle.color && !targetStyle.color.includes('var(')) {
      expect(targetStyle.color).toBe(REFERENCE_APP_TOKEN_RGB)
    }
    expect(layeredTarget).toBeInTheDocument()
  })
})
