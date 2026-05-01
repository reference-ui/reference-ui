/**
 * @vitest-environment happy-dom
 *
 * Color mode is a consumer-controlled, global concern. These tests intentionally
 * document the contract we want: root tokens, extended libraries, and layered
 * libraries should all respond when the consumer toggles theme state.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/extend-library'
import {
  lightDarkDemoBgLightRgb as layerBgLightRgb,
  lightDarkDemoBgDarkRgb as layerBgDarkRgb,
  lightDarkDemoTextLightRgb as layerTextLightRgb,
  lightDarkDemoTextDarkRgb as layerTextDarkRgb,
} from '@fixtures/layer-library'
import {
  REFERENCE_UNIT_MODE_LIGHT_RGB,
  REFERENCE_UNIT_MODE_DARK_RGB,
} from '../../src/system/styles'
import { injectDesignSystemCss } from '../primitives/setup'
import { expectResolvedRgb, requireDesignSystemCss } from '../utils/design-system-css'

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
})

describe('consumer token resolution in light mode', () => {
  // TODO(matrix/color-mode): Add extended-library token resolution coverage to
  // matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire this case.
  it('consumer primitives resolve extended library color-mode tokens in light mode', () => {
    render(
      <Div data-testid="ext" bg="lightDarkDemoBg" color="lightDarkDemoText">
        e
      </Div>,
    )

    expectResolvedRgb(
      screen.getByTestId('ext'),
      'backgroundColor',
      lightDarkDemoBgLightRgb,
      'extended library token resolves on consumer primitive in light mode',
    )
    expectResolvedRgb(
      screen.getByTestId('ext'),
      'color',
      lightDarkDemoTextLightRgb,
      'extended library text token resolves on consumer primitive in light mode',
    )
  })

  // TODO(matrix/color-mode): Add layered public token resolution coverage to
  // matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire this case.
  it('consumer primitives resolve layered public color-mode tokens in light mode', () => {
    render(
      <Div data-testid="layer" bg="lightDarkDemoBg" color="lightDarkDemoText">
        l
      </Div>,
    )

    expectResolvedRgb(
      screen.getByTestId('layer'),
      'backgroundColor',
      layerBgLightRgb,
      'layered public token resolves on consumer primitive in light mode',
    )
    expectResolvedRgb(
      screen.getByTestId('layer'),
      'color',
      layerTextLightRgb,
      'layered public text token resolves on consumer primitive in light mode',
    )
  })

  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('consumer primitives resolve root color-mode tokens in light mode', () => {
    render(
      <Div data-testid="root" color="referenceUnitColorModeToken">
        r
      </Div>,
    )

    expectResolvedRgb(
      screen.getByTestId('root'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'root color-mode token resolves on consumer primitive in light mode',
    )
  })
})

describe('ancestor theme wrappers', () => {
  // TODO(matrix/color-mode): Add extended-library dark-scope token resolution coverage to
  // matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire this case.
  it('ancestor theme wrapper flips extended library tokens to dark', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="ext-wrap" bg="lightDarkDemoBg" color="lightDarkDemoText">
          e
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('ext-wrap'),
      'backgroundColor',
      lightDarkDemoBgDarkRgb,
      'ancestor dark theme flips extended library background token',
    )
    expectResolvedRgb(
      screen.getByTestId('ext-wrap'),
      'color',
      lightDarkDemoTextDarkRgb,
      'ancestor dark theme flips extended library text token',
    )
  })

  // TODO(matrix/color-mode): Add layered public dark-scope token resolution coverage to
  // matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire this case.
  it('ancestor theme wrapper flips layered public tokens to dark', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="layer-wrap" bg="lightDarkDemoBg" color="lightDarkDemoText">
          l
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('layer-wrap'),
      'backgroundColor',
      layerBgDarkRgb,
      'ancestor dark theme flips layered public background token',
    )
    expectResolvedRgb(
      screen.getByTestId('layer-wrap'),
      'color',
      layerTextDarkRgb,
      'ancestor dark theme flips layered public text token',
    )
  })

  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('ancestor theme wrapper flips root color-mode tokens to dark', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="root-wrap" color="referenceUnitColorModeToken">
          r
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('root-wrap'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'ancestor dark theme flips root color-mode token',
    )
  })

  // TODO(matrix/color-mode): Add typography utility composition coverage alongside
  // color-mode root tokens to matrix/color-mode/tests/e2e/system-contract.spec.ts,
  // then retire this case.
  it('ancestor dark theme preserves large typography utility props on consumer primitives', () => {
    render(
      <div data-panda-theme="dark">
        <Div
          data-testid="root-typography-wrap"
          font="sans"
          fontSize="60px"
          lineHeight="70px"
          whiteSpace="nowrap"
          color="referenceUnitColorModeToken"
        >
          Typography
        </Div>
      </div>,
    )

    const el = screen.getByTestId('root-typography-wrap')
    const style = window.getComputedStyle(el)

    expectResolvedRgb(
      el,
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'ancestor dark theme keeps root token color while typography utilities are applied',
    )
    expect(style.fontSize).toBe('60px')
    expect(style.lineHeight).toBe('70px')
    expect(style.whiteSpace).toBe('nowrap')
  })
})

describe('authored host scopes', () => {
  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('nested dark colorMode creates a dark island inside a light theme scope', () => {
    render(
      <div data-panda-theme="light">
        <Div data-testid="outer-light-token" color="referenceUnitColorModeToken">
          Outer light token
        </Div>
        <Div
          data-testid="inner-dark-token"
          colorMode="dark"
          color="referenceUnitColorModeToken"
        >
          Inner dark token
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('outer-light-token'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'outer light scope keeps the light token value',
    )
    expectResolvedRgb(
      screen.getByTestId('inner-dark-token'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'nested dark colorMode should override the surrounding light scope',
    )
  })

  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('docs-style explicit light preview should create a light island inside a dark theme scope', () => {
    render(
      <div data-panda-theme="dark">
        <Div
          data-testid="docs-preview-dark-token"
          colorMode="dark"
          color="referenceUnitColorModeToken"
        >
          Docs preview dark token
        </Div>
        <Div
          data-testid="docs-preview-light-token"
          colorMode="light"
          color="referenceUnitColorModeToken"
        >
          Docs preview light token
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('docs-preview-dark-token'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'docs preview dark branch keeps the dark token value',
    )
    expectResolvedRgb(
      screen.getByTestId('docs-preview-light-token'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'docs preview light branch should escape the surrounding dark scope',
    )
  })

  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('docs-style dark preview should create a dark island inside a light theme scope', () => {
    render(
      <div data-panda-theme="light">
        <Div data-testid="docs-preview-light-host-token" color="referenceUnitColorModeToken">
          Docs preview light host token
        </Div>
        <Div
          data-testid="docs-preview-dark-island-token"
          colorMode="dark"
          color="referenceUnitColorModeToken"
        >
          Docs preview dark island token
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('docs-preview-light-host-token'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'docs preview light host keeps the light token value',
    )
    expectResolvedRgb(
      screen.getByTestId('docs-preview-dark-island-token'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'docs preview dark branch should override the surrounding light scope',
    )
  })
})

describe('descendant cascade', () => {
  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('nested descendants follow the nearest explicit light or dark scope', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="cascade-light-scope" colorMode="light">
          <Div data-testid="cascade-light-child" color="referenceUnitColorModeToken">
            Cascade light child
          </Div>
        </Div>
        <Div data-testid="cascade-dark-scope" colorMode="dark">
          <Div data-testid="cascade-dark-child" color="referenceUnitColorModeToken">
            Cascade dark child
          </Div>
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('cascade-light-child'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'descendant inside explicit light scope should resolve the light token value',
    )
    expectResolvedRgb(
      screen.getByTestId('cascade-dark-child'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'descendant inside explicit dark scope should resolve the dark token value',
    )
  })

  // TODO(matrix/color-mode): Add extended-library descendant cascade coverage to
  // matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire this case.
  it('extended public tokens cascade to descendants inside explicit light and dark scopes', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="ext-light-scope" colorMode="light">
          <Div data-testid="ext-light-child" bg="lightDarkDemoBg" color="lightDarkDemoText">
            Extended light child
          </Div>
        </Div>
        <Div data-testid="ext-dark-scope" colorMode="dark">
          <Div data-testid="ext-dark-child" bg="lightDarkDemoBg" color="lightDarkDemoText">
            Extended dark child
          </Div>
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('ext-light-child'),
      'backgroundColor',
      lightDarkDemoBgLightRgb,
      'extended descendant inside explicit light scope should resolve the light background token',
    )
    expectResolvedRgb(
      screen.getByTestId('ext-light-child'),
      'color',
      lightDarkDemoTextLightRgb,
      'extended descendant inside explicit light scope should resolve the light text token',
    )
    expectResolvedRgb(
      screen.getByTestId('ext-dark-child'),
      'backgroundColor',
      lightDarkDemoBgDarkRgb,
      'extended descendant inside explicit dark scope should resolve the dark background token',
    )
    expectResolvedRgb(
      screen.getByTestId('ext-dark-child'),
      'color',
      lightDarkDemoTextDarkRgb,
      'extended descendant inside explicit dark scope should resolve the dark text token',
    )
  })

  // TODO(matrix/color-mode): Add layered public descendant cascade coverage to
  // matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire this case.
  it('layered public tokens cascade to descendants inside explicit light and dark scopes', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="layer-light-scope" colorMode="light">
          <Div data-testid="layer-light-child" bg="lightDarkDemoBg" color="lightDarkDemoText">
            Layer light child
          </Div>
        </Div>
        <Div data-testid="layer-dark-scope" colorMode="dark">
          <Div data-testid="layer-dark-child" bg="lightDarkDemoBg" color="lightDarkDemoText">
            Layer dark child
          </Div>
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('layer-light-child'),
      'backgroundColor',
      layerBgLightRgb,
      'layered descendant inside explicit light scope should resolve the light background token',
    )
    expectResolvedRgb(
      screen.getByTestId('layer-light-child'),
      'color',
      layerTextLightRgb,
      'layered descendant inside explicit light scope should resolve the light text token',
    )
    expectResolvedRgb(
      screen.getByTestId('layer-dark-child'),
      'backgroundColor',
      layerBgDarkRgb,
      'layered descendant inside explicit dark scope should resolve the dark background token',
    )
    expectResolvedRgb(
      screen.getByTestId('layer-dark-child'),
      'color',
      layerTextDarkRgb,
      'layered descendant inside explicit dark scope should resolve the dark text token',
    )
  })

  // MIGRATED: Covered by matrix/color-mode/tests/e2e/system-contract.spec.ts.
  it.skip('sibling light and dark descendant islands stay independent under one dark ancestor', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="sibling-light-scope" colorMode="light">
          <Div data-testid="sibling-light-child" color="referenceUnitColorModeToken">
            Sibling light child
          </Div>
        </Div>
        <Div data-testid="sibling-dark-scope" colorMode="dark">
          <Div data-testid="sibling-dark-child" color="referenceUnitColorModeToken">
            Sibling dark child
          </Div>
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('sibling-light-child'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'sibling explicit light scope should stay light even next to a dark island',
    )
    expectResolvedRgb(
      screen.getByTestId('sibling-dark-child'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'sibling explicit dark scope should stay dark independently',
    )
  })
})

describe('authored host scopes with utility props', () => {
  // TODO(matrix/color-mode): Add extended-library typography utility composition
  // coverage to matrix/color-mode/tests/e2e/system-contract.spec.ts, then retire
  // this case.
  it('node-level dark mode preserves large typography utility props with extended tokens', () => {
    render(
      <Div
        data-testid="ext-typography-dark"
        colorMode="dark"
        font="sans"
        fontSize="32px"
        lineHeight="40px"
        whiteSpace="nowrap"
        bg="lightDarkDemoBg"
        color="lightDarkDemoText"
      >
        Extended typography
      </Div>,
    )

    const el = screen.getByTestId('ext-typography-dark')
    const style = window.getComputedStyle(el)

    expectResolvedRgb(
      el,
      'backgroundColor',
      lightDarkDemoBgDarkRgb,
      'node-level dark mode keeps extended background token while typography utilities are applied',
    )
    expectResolvedRgb(
      el,
      'color',
      lightDarkDemoTextDarkRgb,
      'node-level dark mode keeps extended text token while typography utilities are applied',
    )
    expect(style.fontSize).toBe('32px')
    expect(style.lineHeight).toBe('40px')
    expect(style.whiteSpace).toBe('nowrap')
  })
})
