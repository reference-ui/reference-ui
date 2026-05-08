import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import type { ComponentProps } from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  Div,
  Span,
  css,
  recipe,
  type BaseSystem as ReactBaseSystem,
  type CssStyles,
  type DivProps,
  type PrimitiveProps,
  type ResponsiveProps,
  type StyleProps,
} from '@reference-ui/react'
import {
  getRhythm,
  keyframes,
  tokens,
  type KeyframesConfig,
  type ReferenceTokenConfig,
  type TokenConfig,
} from '@reference-ui/system'
import { baseSystem as generatedBaseSystem } from '@reference-ui/system/baseSystem'
import { App } from '../../src/App'

const pkgRoot = process.cwd()
const refUiDir = join(pkgRoot, '.reference-ui')
const pandaConfigPath = join(refUiDir, 'panda.config.ts')
const reactStylesPath = join(refUiDir, 'react', 'styles.css')
const reactRuntimePath = join(refUiDir, 'react', 'react.mjs')
const styledDir = join(refUiDir, 'styled')
const styledPackageJsonPath = join(styledDir, 'package.json')
const styledStylesPath = join(styledDir, 'styles.css')
const systemRuntimePath = join(refUiDir, 'system', 'system.mjs')
const baseSystemPath = join(refUiDir, 'system', 'baseSystem.mjs')
const srcDir = join(pkgRoot, 'src')
const testsDir = join(pkgRoot, 'tests', 'unit')
const jsxElementsPath = join(refUiDir, 'system', 'jsx-elements.json')
const virtualSrcDir = join(refUiDir, 'virtual', 'src')

function* walkFiles(dir: string, base = dir): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      yield* walkFiles(path, base)
      continue
    }

    yield relative(base, path)
  }
}

function getSourcePaths(): string[] {
  if (!existsSync(srcDir)) {
    return []
  }

  return Array.from(walkFiles(srcDir, srcDir))
    .filter((path) => ['.ts', '.tsx', '.mdx'].includes(extname(path)))
    .sort((left, right) => left.localeCompare(right))
}

function getVirtualSourcePaths(): string[] {
  if (!existsSync(virtualSrcDir)) {
    return []
  }

  return Array.from(walkFiles(virtualSrcDir, virtualSrcDir))
    .sort((left, right) => left.localeCompare(right))
}

function runRefCommand(...args: string[]): string {
  try {
    return execFileSync('pnpm', ['exec', 'ref', ...args], {
      cwd: pkgRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    }).toString('utf8')
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      [`ref ${args.join(' ')} failed`, '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join(
        '\n',
      ),
    )
  }
}

function runNodeImportProbe(): string {
  return execFileSync(
    'node',
    [
      '--input-type=module',
      '-e',
      [
        "const react = await import('@reference-ui/react')",
        "const system = await import('@reference-ui/system/baseSystem')",
        "if (!('Div' in react) || !react.Div) throw new Error('Expected generated Div export')",
        "if (typeof react.css !== 'function') throw new Error('Expected generated css export')",
        "if (!system.baseSystem || system.baseSystem.name !== 'distro') throw new Error('Expected generated baseSystem export')",
        "console.log('ok')",
      ].join('; '),
    ],
    {
      cwd: pkgRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    },
  )
    .toString('utf8')
    .trim()
}

function runTypecheckProject(projectPath: string): string {
  try {
    return execFileSync('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false', '--project', projectPath], {
      cwd: pkgRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    }).toString('utf8')
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      ['tsc failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
    )
  }
}

async function interruptRefSyncAfterFreshPandaConfig(): Promise<{
  exit: { code: number | null; signal: NodeJS.Signals | null }
  pandaSeen: boolean
}> {
  runRefCommand('clean')

  const child = spawn('pnpm', ['exec', 'ref', 'sync'], {
    cwd: pkgRoot,
    detached: true,
    env: { ...process.env, FORCE_COLOR: '0' },
    stdio: 'ignore',
  })

  const terminateChild = () => {
    if (typeof child.pid !== 'number') {
      child.kill('SIGTERM')
      return
    }

    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }

  const started = Date.now()
  let killed = false
  let pandaSeen = false

  await new Promise<void>((resolve, reject) => {
    child.once('error', reject)

    const tick = () => {
      if (existsSync(pandaConfigPath)) {
        pandaSeen = true
      }

      if (!killed && pandaSeen) {
        terminateChild()
        killed = true
      }

      if (killed) {
        resolve()
        return
      }

      if (Date.now() - started > 15_000) {
        terminateChild()
        killed = true
        resolve()
        return
      }

      setTimeout(tick, 50)
    }

    tick()
  })

  const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })

  return { exit, pandaSeen }
}

// Type helpers used for expectTypeOf assertions throughout this file.
type DivComponentProps = ComponentProps<typeof Div>
type DivColorProp = NonNullable<DivComponentProps['color']>
type DivBgProp = NonNullable<DivComponentProps['bg']>
type DivBackgroundProp = NonNullable<DivComponentProps['background']>

function expectDivColor(_value: DivColorProp): void {}
function expectDivBg(_value: DivBgProp): void {}
function expectDivBackground(_value: DivBackgroundProp): void {}
function expectCssStyles(_value: CssStyles): void {}
function expectTokenConfig(_value: ReferenceTokenConfig): void {}
function expectKeyframesConfig(_value: KeyframesConfig): void {}

// ─── install surface ─────────────────────────────────────────────────────────

describe('distro – install surface', () => {
  it('exposes the minimal downstream marker content', () => {
    const element = App()

    expect(element.type).toBe('main')
    expect(element.props['data-testid']).toBe('distro-root')

    const children = element.props.children as Array<{ props?: { children?: string } }>

    expect(children[0]?.props?.children).toBe('Reference UI distro matrix')
    expect(children[1]?.props?.children).toBe('This is the minimal matrix-enabled distro scenario.')
  })

  it('creates the generated styled package with package metadata and Panda pattern exports', () => {
    expect(existsSync(styledDir), '.reference-ui/styled should exist').toBe(true)
    expect(existsSync(styledPackageJsonPath), 'styled package.json').toBe(true)

    const styledPackage = JSON.parse(readFileSync(styledPackageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>
    }

    expect(styledPackage.exports).toMatchObject({
      '.': {
        import: './css/index.js',
        types: './css/index.d.ts',
      },
      './patterns': {
        import: './patterns/index.js',
        types: './patterns/index.d.ts',
      },
    })

    if (existsSync(join(styledDir, 'css'))) {
      expect(existsSync(join(styledDir, 'patterns')), 'styled/patterns when css exists').toBe(true)
    }
  })

  it('keeps generated styled/styles.css in a layered distro form', () => {
    expect(existsSync(styledStylesPath), 'styled/styles.css').toBe(true)

    const css = readFileSync(styledStylesPath, 'utf8')

    expect(css).toMatch(/^@layer\s+reference-ui,\s*distro;/)
    expect(css).toMatch(/@layer\s+distro\s*\{/)
    expect(css).toContain('@layer reset, global, base, tokens, recipes, utilities;')
  })

  it(
    'allows one additional ref sync run in the same consumer',
    () => {
      runRefCommand('sync')
    },
    90_000,
  )

  it(
    'removes stale virtual source files after source renames and deletions',
    () => {
      const originalSourcePath = join(srcDir, 'RefSyncLifecycleProbe.tsx')
      const renamedSourcePath = join(srcDir, 'RefSyncLifecycleProbeRenamed.tsx')
      const originalVirtualPath = join(virtualSrcDir, 'RefSyncLifecycleProbe.tsx')
      const renamedVirtualPath = join(virtualSrcDir, 'RefSyncLifecycleProbeRenamed.tsx')
      const sourceContent = [
        'export function RefSyncLifecycleProbe() {',
        "  return <span data-testid=\"ref-sync-lifecycle-probe\">probe</span>",
        '}',
        '',
      ].join('\n')
      let testError: unknown

      try {
        for (const path of [originalSourcePath, renamedSourcePath]) {
          if (existsSync(path)) {
            unlinkSync(path)
          }
        }

        writeFileSync(originalSourcePath, sourceContent)

        runRefCommand('sync')

        expect(readFileSync(originalVirtualPath, 'utf8')).toBe(sourceContent)

        renameSync(originalSourcePath, renamedSourcePath)

        runRefCommand('sync')

        expect(existsSync(originalVirtualPath)).toBe(false)
        expect(readFileSync(renamedVirtualPath, 'utf8')).toBe(sourceContent)

        unlinkSync(renamedSourcePath)

        runRefCommand('sync')

        expect(existsSync(renamedVirtualPath)).toBe(false)
      } catch (error) {
        testError = error
        throw error
      } finally {
        let cleanupError: unknown

        try {
          for (const path of [originalSourcePath, renamedSourcePath]) {
            if (existsSync(path)) {
              unlinkSync(path)
            }
          }

          if (existsSync(originalVirtualPath) || existsSync(renamedVirtualPath)) {
            runRefCommand('sync')
          }
        } catch (error) {
          cleanupError = error
        }

        if (!testError && cleanupError) {
          throw cleanupError
        }
      }
    },
    90_000,
  )

  it('keeps the generated virtual src tree in exact sync with included source files', () => {
    expect(getVirtualSourcePaths()).toEqual(getSourcePaths())
  })

  it(
    'rewrites intentionally stale generated runtime artifacts during a cold sync',
    () => {
      const reactOriginal = readFileSync(reactRuntimePath, 'utf8')
      const systemOriginal = readFileSync(systemRuntimePath, 'utf8')
      const baseSystemOriginal = readFileSync(baseSystemPath, 'utf8')

      try {
        writeFileSync(reactRuntimePath, 'STALE_REACT_RUNTIME_MARKER')
        writeFileSync(systemRuntimePath, 'STALE_SYSTEM_RUNTIME_MARKER')
        writeFileSync(baseSystemPath, 'STALE_BASE_SYSTEM_MARKER')

        runRefCommand('sync')

        const nextReactRuntime = readFileSync(reactRuntimePath, 'utf8')
        const nextSystemRuntime = readFileSync(systemRuntimePath, 'utf8')
        const nextBaseSystem = readFileSync(baseSystemPath, 'utf8')

        expect(nextReactRuntime).not.toContain('STALE_REACT_RUNTIME_MARKER')
        expect(nextSystemRuntime).not.toContain('STALE_SYSTEM_RUNTIME_MARKER')
        expect(nextBaseSystem).not.toContain('STALE_BASE_SYSTEM_MARKER')
        expect(nextReactRuntime).toContain('Div')
        expect(nextSystemRuntime).toContain('function tokens')
        expect(nextBaseSystem).toContain('distro')
        expect(runNodeImportProbe()).toBe('ok')
      } finally {
        if (existsSync(reactRuntimePath) && readFileSync(reactRuntimePath, 'utf8') === 'STALE_REACT_RUNTIME_MARKER') {
          writeFileSync(reactRuntimePath, reactOriginal)
        }

        if (existsSync(systemRuntimePath) && readFileSync(systemRuntimePath, 'utf8') === 'STALE_SYSTEM_RUNTIME_MARKER') {
          writeFileSync(systemRuntimePath, systemOriginal)
        }

        if (existsSync(baseSystemPath) && readFileSync(baseSystemPath, 'utf8') === 'STALE_BASE_SYSTEM_MARKER') {
          writeFileSync(baseSystemPath, baseSystemOriginal)
        }
      }
    },
    90_000,
  )

  it(
    'recovers from an interrupted cold sync after fresh partial output is created',
    async () => {
      const { exit, pandaSeen } = await interruptRefSyncAfterFreshPandaConfig()

      expect(pandaSeen).toBe(true)
      expect(exit.signal).toBe('SIGTERM')

      runRefCommand('sync')

      expect(readFileSync(reactRuntimePath, 'utf8')).toContain('Div')
      expect(readFileSync(systemRuntimePath, 'utf8')).toContain('function tokens')
      expect(readFileSync(baseSystemPath, 'utf8')).toContain('distro')
      expect(runNodeImportProbe()).toBe('ok')
    },
    90_000,
  )

  it(
    'restores generated packages after ref clean so consumer imports work again',
    () => {
      expect(existsSync(reactRuntimePath)).toBe(true)
      expect(existsSync(baseSystemPath)).toBe(true)

      runRefCommand('clean')

      expect(existsSync(reactRuntimePath)).toBe(false)
      expect(existsSync(baseSystemPath)).toBe(false)

      runRefCommand('sync')

      expect(existsSync(reactRuntimePath)).toBe(true)
      expect(existsSync(baseSystemPath)).toBe(true)
      expect(runNodeImportProbe()).toBe('ok')
    },
    90_000,
  )

  it.skip('does not signal watch readiness until stale runtime artifacts are replaced', () => {
    // Future work: this needs a single-consumer watch harness with a deterministic ready sentinel.
  })
})

// ─── generated @reference-ui/react ───────────────────────────────────────────

describe('distro – generated @reference-ui/react package', () => {
  it('resolves Div at runtime and in the TypeScript surface', () => {
    const props: DivProps = {
      children: 'Reference UI distro matrix',
    }

    expect(Div).toBeTruthy()
    expect(props.children).toBe('Reference UI distro matrix')
    expectTypeOf<DivProps>().toMatchTypeOf<DivComponentProps>()
  })

  it('keeps primitive color props token-aware in consumer space', () => {
    const tokenSafeProps: DivProps = {
      color: 'blue.400',
      bg: 'gray.300',
      background: 'gray.300',
      p: '4',
      rounded: 'md',
    }

    const tokenSafeComponentProps: DivComponentProps = {
      color: 'blue.400',
      bg: 'gray.300',
      background: 'gray.300',
      p: '4',
      rounded: 'md',
    }

    const validElement = <Div color="blue.400" bg="gray.300" background="gray.300" p="4" rounded="md" />

    expectDivColor('blue.400')
    expectDivBg('gray.300')
    expectDivBackground('gray.300')

    // @ts-expect-error primitive color props must not widen back to arbitrary strings
    const invalidDivProps: DivProps = { color: 'definitely-not-a-token' }

    // @ts-expect-error runtime component props must preserve the same token narrowing
    const invalidComponentProps: DivComponentProps = { bg: 'not-a-bg-token' }

    // @ts-expect-error runtime component props must preserve the same token narrowing
    const invalidBackgroundComponentProps: DivComponentProps = { background: 'not-a-background-token' }

    // @ts-expect-error JSX consumer usage must reject arbitrary color strings
    const invalidColorElement = <Div color="definitely-not-a-token" />

    // @ts-expect-error JSX consumer usage must reject arbitrary background tokens
    const invalidBgElement = <Div bg="not-a-bg-token" />

    // @ts-expect-error JSX consumer usage must reject arbitrary background tokens
    const invalidBackgroundElement = <Div background="not-a-background-token" />

    // @ts-expect-error extracted color prop type must stay token-aware
    expectDivColor('definitely-not-a-token')

    // @ts-expect-error extracted bg prop type must stay token-aware
    expectDivBg('not-a-bg-token')

    // @ts-expect-error extracted background prop type must stay token-aware
    expectDivBackground('not-a-background-token')

    expect(tokenSafeProps.color).toBe('blue.400')
    expect(tokenSafeComponentProps.bg).toBe('gray.300')
    expect(validElement).toBeTruthy()
    expectTypeOf<DivProps>().toMatchTypeOf<DivComponentProps>()
    void invalidDivProps
    void invalidComponentProps
    void invalidBackgroundComponentProps
    void invalidColorElement
    void invalidBgElement
    void invalidBackgroundElement
  })

  it('keeps css() token-aware in consumer space', () => {
    const validStyles: CssStyles = {
      bg: 'blue.400',
      color: 'gray.50',
      p: '4',
      rounded: 'md',
    }
    const mergedClassName = css(validStyles, false, undefined, null, [{ display: 'flex' }])
    const rawStyles = css.raw(validStyles, [{ display: 'flex' }])

    const className = css(validStyles)

    expect(className).toBeTruthy()
    expect(mergedClassName).toBeTruthy()
    expect(rawStyles).toEqual(expect.objectContaining({
      background: 'blue.400',
      borderRadius: 'md',
      color: 'gray.50',
      display: 'flex',
      padding: '4',
    }))
    expectTypeOf(css).returns.toBeString()
    expectTypeOf(css.raw).returns.not.toEqualTypeOf<never>()
    expectCssStyles(validStyles)
    expectCssStyles(rawStyles)
  })

  it(
    'keeps generated token types aligned with runtime token output after ref sync',
    () => {
      const contractTokenKey = 'distroContract'
      const contractTokenLeaf = 'brand'
      const contractTokenPath = `${contractTokenKey}.${contractTokenLeaf}`
      const contractTokenValue = '#7c3aed'
      const contractTokenVariable = '--colors-distro-contract-brand'
      const tokenFragmentPath = join(srcDir, 'DistroTokenContractFragment.ts')
      const typecheckProbePath = join(testsDir, 'distro-token-contract.probe.tsx')
      const typecheckProjectPath = join(testsDir, 'distro-token-contract.tsconfig.json')
      const tokenFragmentSource = [
        "import { tokens } from '@reference-ui/system'",
        '',
        'tokens({',
        '  colors: {',
        `    ${contractTokenKey}: {`,
        `      ${contractTokenLeaf}: { value: '${contractTokenValue}' },`,
        '    },',
        '  },',
        '})',
        '',
      ].join('\n')
      const typecheckProbeSource = [
        "import { Div, css, type DivProps } from '@reference-ui/react'",
        '',
        `const tokenProps: DivProps = { color: '${contractTokenPath}', bg: '${contractTokenPath}' }`,
        `const tokenClassName = css({ color: '${contractTokenPath}', backgroundColor: '${contractTokenPath}' })`,
        `const tokenElement = <Div color=\"${contractTokenPath}\" bg=\"${contractTokenPath}\" />`,
        '',
        "// @ts-expect-error custom generated token unions must not widen back to arbitrary strings",
        "const invalidTokenProps: DivProps = { color: 'definitely-not-a-token' }",
        '',
        'void tokenProps',
        'void tokenClassName',
        'void tokenElement',
        'void invalidTokenProps',
        '',
      ].join('\n')
      const typecheckProjectSource = JSON.stringify(
        {
          extends: '../../tsconfig.json',
          compilerOptions: {
            noEmit: true,
          },
          include: ['distro-token-contract.probe.tsx'],
        },
        null,
        2,
      )

      try {
        for (const path of [tokenFragmentPath, typecheckProbePath, typecheckProjectPath]) {
          if (existsSync(path)) {
            unlinkSync(path)
          }
        }

        writeFileSync(tokenFragmentPath, tokenFragmentSource)
        writeFileSync(typecheckProbePath, typecheckProbeSource)
        writeFileSync(typecheckProjectPath, typecheckProjectSource + '\n')

        runRefCommand('sync')

        const generatedConfig = readFileSync(pandaConfigPath, 'utf8')
        const generatedStyles = readFileSync(reactStylesPath, 'utf8')

        expect(generatedConfig).toContain(contractTokenKey)
        expect(generatedStyles).toContain(contractTokenVariable)
        expect(generatedStyles).toContain(contractTokenValue)
        expect(runTypecheckProject(typecheckProjectPath)).toBe('')
      } finally {
        for (const path of [tokenFragmentPath, typecheckProbePath, typecheckProjectPath]) {
          if (existsSync(path)) {
            unlinkSync(path)
          }
        }

        runRefCommand('sync')
      }
    },
    90_000,
  )

  it('keeps additional generated primitives, recipe helpers, and type barrels available', () => {
    const spanElement = <Span color="blue.400">Generated package surface smoke</Span>
    const badgeRecipe = recipe({
      base: { display: 'inline-flex' },
      variants: {
        tone: {
          brand: { color: 'blue.400' },
          quiet: { color: 'gray.300' },
        },
      },
      defaultVariants: {
        tone: 'brand',
      },
    })

    expect(Span).toBeTruthy()
    expect(spanElement).toBeTruthy()
    expect(badgeRecipe({ tone: 'brand' })).toBeTruthy()
    expect(generatedBaseSystem).toMatchObject({ name: 'distro' })

    expectTypeOf<ReactBaseSystem>().not.toEqualTypeOf<never>()
    expectTypeOf<PrimitiveProps<'button'>>().not.toEqualTypeOf<never>()
    expectTypeOf<ResponsiveProps>().not.toEqualTypeOf<never>()
    expectTypeOf<StyleProps>().toMatchTypeOf<{ size?: unknown }>()
  })
})

// ─── generated @reference-ui/system ──────────────────────────────────────────

describe('distro – generated @reference-ui/system package', () => {
  it('resolves token and keyframe APIs at runtime and in the TypeScript surface', () => {
    const tokenConfig: TokenConfig = {
      colors: {
        brand: {
          value: '#3366ff',
        },
      },
      animations: {
        pulse: {
          value: 'pulse 240ms ease-in-out',
        },
      },
      durations: {
        quick: {
          value: '240ms',
        },
      },
    }

    const keyframesConfig: KeyframesConfig = {
      pulse: {
        '0%': { opacity: '0.4' },
        '100%': { opacity: '1' },
      },
    }

    expect(typeof tokens).toBe('function')
    expect(typeof keyframes).toBe('function')
    expect(typeof getRhythm).toBe('function')

    expect(() => tokens(tokenConfig)).not.toThrow()
    expect(() => keyframes(keyframesConfig)).not.toThrow()
    expect(getRhythm(2)).toBeTruthy()

    expectTokenConfig(tokenConfig)
    expectKeyframesConfig(keyframesConfig)

    expectTypeOf(tokens).parameter(0).toMatchTypeOf<ReferenceTokenConfig>()
    expectTypeOf(keyframes).parameter(0).toMatchTypeOf<KeyframesConfig>()
    expectTypeOf(getRhythm).returns.toBeString()
  })

  it('keeps generated baseSystem portable for downstream consumers', () => {
    expect(generatedBaseSystem).toMatchObject({
      css: expect.any(String),
      jsxElements: expect.any(Array),
      name: 'distro',
    })

    expect(generatedBaseSystem.css).toContain('@layer')
    expect(generatedBaseSystem.css).toContain('data-layer')
    expect(generatedBaseSystem.jsxElements).toContain('MonoText')
  })

  it('writes merged jsx-elements metadata for downstream tooling', () => {
    const jsxElements = JSON.parse(readFileSync(jsxElementsPath, 'utf8')) as {
      local: string[]
      merged: string[]
      primitives: string[]
      upstream: string[]
    }

    expect(jsxElements.local).toEqual([])
    expect(jsxElements.upstream).toContain('MonoText')
    expect(jsxElements.primitives).toContain('Div')
    expect(jsxElements.merged).toContain('MonoText')
    expect(jsxElements.merged).toContain('Div')
  })
})
