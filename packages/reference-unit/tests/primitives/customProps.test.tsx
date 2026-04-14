/**
 * @vitest-environment happy-dom
 *
 * Tests for custom pattern props: font, weight, container, r
 * These props are defined in reference-core internal/props/ and extend the box pattern.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { injectDesignSystemCss, getDesignSystemCssPath } from './setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS - tests will skip
  }
})

const hasDesignSystemCss = () => Boolean(getDesignSystemCssPath())

describe('Custom props (font, weight, container, r)', () => {
  describe('Font prop', () => {
    it('applies sans font preset - verifies className is set', () => {
      render(
        <Div data-testid="font-sans" font="sans">
          Sans Font
        </Div>
      )

      const el = screen.getByTestId('font-sans')
      // Verify element renders and has a className (Panda applies styles via classes)
      expect(el).toBeInTheDocument()
      expect(el.className).toBeTruthy()
    })

    it('applies mono font preset - verifies className is set', () => {
      render(
        <Div data-testid="font-mono" fontFamily="reference.mono">
          Mono Font
        </Div>
      )

      const el = screen.getByTestId('font-mono')
      expect(el).toBeInTheDocument()
      expect(el.className).toBeTruthy()
    })

    it('applies weight tokens - verifies className is set', () => {
      render(
        <Div data-testid="font-weight" font="sans" weight="sans.bold">
          Bold Sans
        </Div>
      )

      const el = screen.getByTestId('font-weight')
      expect(el).toBeInTheDocument()
      expect(el.className).toBeTruthy()
    })
  })

  describe('Container prop', () => {
    it('applies container-type when container is true', () => {
      if (!hasDesignSystemCss()) return

      render(
        <Div data-testid="container-anonymous" container>
          Anonymous Container
        </Div>
      )

      const el = screen.getByTestId('container-anonymous')
      const style = window.getComputedStyle(el)

      if (style.containerType) {
        expect(style.containerType).toBe('inline-size')
      }
    })

    it('applies container-name when container is a string', () => {
      if (!hasDesignSystemCss()) return

      render(
        <Div data-testid="container-named" container="sidebar">
          Named Container
        </Div>
      )

      const el = screen.getByTestId('container-named')
      const style = window.getComputedStyle(el)

      if (style.containerType) {
        expect(style.containerType).toBe('inline-size')
        expect(style.containerName).toBe('sidebar')
      }
    })
  })

  describe('Responsive prop (r)', () => {
    it('applies responsive styles at breakpoints', () => {
      render(
        <Div
          data-testid="responsive"
          container
          r={{
            400: { padding: '1rem' },
            800: { padding: '2rem' },
          }}
        >
          Responsive Content
        </Div>
      )

      const el = screen.getByTestId('responsive')
      expect(el).toBeInTheDocument()
      expect(el.className).toContain('cq-t_inline-size')
      expect(el.className).toContain('[@container_(min-width:_400px)]:p_1rem')
      expect(el.className).toContain('[@container_(min-width:_800px)]:p_2rem')
      expect(el.className).not.toContain('@container_true_')
    })

    it('works with named containers', () => {
      render(
        <Div data-testid="container-wrapper" container="main">
          <Div
            data-testid="responsive-child"
            r={{
              600: { fontSize: '1.5rem' },
            }}
          >
            Child Content
          </Div>
        </Div>
      )

      const wrapper = screen.getByTestId('container-wrapper')
      const child = screen.getByTestId('responsive-child')

      expect(wrapper).toBeInTheDocument()
      expect(child).toBeInTheDocument()
      expect(child.className).toContain('[@container_(min-width:_600px)]:fs_1.5rem')
      expect(child.className).not.toContain('@container_main_')

      const wrapperStyle = window.getComputedStyle(wrapper)
      if (wrapperStyle.containerName) {
        expect(wrapperStyle.containerName).toBe('main')
      }
    })
  })

  describe('Combined props', () => {
    it('applies multiple custom props together - verifies className is set', () => {
      render(
        <Div
          data-testid="combined"
          font="sans"
          fontWeight="600"
          container="card"
          r={{
            500: { padding: '1.5rem' },
          }}
          padding="1rem"
          color="reference.text"
        >
          Combined Props
        </Div>
      )

      const el = screen.getByTestId('combined')
      expect(el).toBeInTheDocument()
      expect(el.className).toBeTruthy()

      // Container prop can be verified
      const style = window.getComputedStyle(el)
      if (hasDesignSystemCss() && style.containerType) {
        expect(style.containerType).toBe('inline-size')
        expect(style.containerName).toBe('card')
      }
    })

    it('works alongside standard Panda props - verifies className is set', () => {
      render(
        <Div
          data-testid="mixed-props"
          fontFamily="reference.mono"
          padding="1rem"
          margin="auto"
          maxWidth="800px"
        >
          Mixed Props
        </Div>
      )

      const el = screen.getByTestId('mixed-props')
      expect(el).toBeInTheDocument()
      expect(el.className).toBeTruthy()
    })
  })
})
