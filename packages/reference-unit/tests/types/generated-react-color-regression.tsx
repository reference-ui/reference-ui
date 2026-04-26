/**
 * Generated `@reference-ui/react` must preserve token-safe primitive color props.
 *
 * This exercises the same consumer surface as the install-test matrix fixture:
 * `DivProps`, `ComponentProps<typeof Div>`, extracted prop types, and direct JSX.
 *
 * If generated package types widen color-bearing props back to `string`, the
 * `@ts-expect-error` assertions below become unused and `tsc --noEmit` fails.
 */
import type { ComponentProps } from 'react'
import { Div, type DivProps } from '@reference-ui/react'

type GeneratedDivComponentProps = ComponentProps<typeof Div>

export type GeneratedDivColorProp = NonNullable<GeneratedDivComponentProps['color']>
export type GeneratedDivBgProp = NonNullable<GeneratedDivComponentProps['bg']>
export type GeneratedDivBackgroundProp = NonNullable<GeneratedDivComponentProps['background']>

export function assertGeneratedDivColor(_value: GeneratedDivColorProp): void {}

export function assertGeneratedDivBg(_value: GeneratedDivBgProp): void {}

export function assertGeneratedDivBackground(_value: GeneratedDivBackgroundProp): void {}

export function GeneratedReactColorRegressionSamples() {
  const tokenSafeProps: DivProps = {
    color: 'referenceUnitToken',
    bg: 'fixtureDemoBg',
    background: 'fixtureDemoBg',
    p: '4',
    rounded: 'md',
  }

  const tokenSafeComponentProps: GeneratedDivComponentProps = {
    color: 'referenceUnitToken',
    bg: 'fixtureDemoBg',
    background: 'fixtureDemoBg',
    p: '4',
    rounded: 'md',
  }

  const validElement = (
    <Div color="referenceUnitToken" bg="fixtureDemoBg" background="fixtureDemoBg" p="4" rounded="md" />
  )

  assertGeneratedDivColor('referenceUnitToken')
  assertGeneratedDivBg('fixtureDemoBg')
  assertGeneratedDivBackground('fixtureDemoBg')

  // @ts-expect-error generated DivProps must reject arbitrary color strings
  const invalidDivProps: DivProps = { color: 'definitely-not-a-token' }

  // @ts-expect-error generated component props must reject arbitrary background strings
  const invalidComponentProps: GeneratedDivComponentProps = { bg: 'not-a-bg-token' }

  const invalidBackgroundComponentProps: GeneratedDivComponentProps = {
    // @ts-expect-error generated component props must reject arbitrary background strings
    background: 'not-a-background-token',
  }

  // @ts-expect-error generated JSX props must reject arbitrary color strings
  const invalidColorElement = <Div color="definitely-not-a-token" />

  // @ts-expect-error generated JSX props must reject arbitrary background strings
  const invalidBgElement = <Div bg="not-a-bg-token" />

  // @ts-expect-error generated JSX props must reject arbitrary background strings
  const invalidBackgroundElement = <Div background="not-a-background-token" />

  // @ts-expect-error extracted generated color prop type must stay token-aware
  assertGeneratedDivColor('definitely-not-a-token')

  // @ts-expect-error extracted generated bg prop type must stay token-aware
  assertGeneratedDivBg('not-a-bg-token')

  // @ts-expect-error extracted generated background prop type must stay token-aware
  assertGeneratedDivBackground('not-a-background-token')

  void tokenSafeProps
  void tokenSafeComponentProps
  void validElement
  void invalidDivProps
  void invalidComponentProps
  void invalidBackgroundComponentProps
  void invalidColorElement
  void invalidBgElement
  void invalidBackgroundElement

  return null
}