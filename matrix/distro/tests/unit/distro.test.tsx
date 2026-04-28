import { execFileSync } from 'node:child_process'
import type { ComponentProps } from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Div, css, type CssStyles, type DivProps } from '@reference-ui/react'
import {
  getRhythm,
  keyframes,
  tokens,
  type KeyframesConfig,
  type ReferenceTokenConfig,
  type TokenConfig,
} from '@reference-ui/system'

import { Index } from '../../src/Index'

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
    const element = Index()

    expect(element.type).toBe('main')
    expect(element.props['data-testid']).toBe('distro-root')

    const children = element.props.children as Array<{ props?: { children?: string } }>

    expect(children[0]?.props?.children).toBe('Reference UI distro matrix')
    expect(children[1]?.props?.children).toBe('This is the minimal matrix-enabled distro scenario.')
  })

  it(
    'allows one additional ref sync run in the same consumer',
    () => {
      try {
        execFileSync('pnpm', ['exec', 'ref', 'sync'], {
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: '0' },
          maxBuffer: 10 * 1024 * 1024,
          stdio: 'pipe',
        })
      } catch (error) {
        if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
          throw error
        }

        const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
        const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

        throw new Error(
          ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
        )
      }
    },
    90_000,
  )
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
    expectTypeOf(css.raw).returns.toEqualTypeOf<CssStyles>()
    expectCssStyles(validStyles)
    expectCssStyles(rawStyles)
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
})
