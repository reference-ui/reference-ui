import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button, Div, Input, Span, Table } from '@reference-ui/react'

import { Index, matrixPrimitivesMarker } from '../../src/index'

describe('primitives matrix runtime', () => {
  it('exports the matrix marker', () => {
    expect(matrixPrimitivesMarker).toBe('reference-ui-matrix-primitives')
  })

  it('renders the fixture entrypoint', () => {
    const element = Index()

    expect(element).toBeTruthy()
  })

  it('renders the expected root test id', () => {
    const element = Index()

    expect(element.props['data-testid']).toBe('primitives-root')
  })

  it('resolves Reference UI runtime packages in Vitest', () => {
    expect(Div).toBeTruthy()
  })

  it('splits variant prop and projects data-variant without leaking raw variant to the DOM', () => {
    const cases = [
      { element: <Button variant="primary">CTA</Button>, expectedTag: 'button', variant: 'primary' },
      { element: <Button variant="ghost">Ghost</Button>, expectedTag: 'button', variant: 'ghost' },
      { element: <Button>Default</Button>, expectedTag: 'button', variant: undefined },
      { element: <Input variant="filled" />, expectedTag: 'input', variant: 'filled' },
      { element: <Input />, expectedTag: 'input', variant: undefined },
      { element: <Div variant="card">Card</Div>, expectedTag: 'div', variant: 'card' },
      { element: <Div>Plain</Div>, expectedTag: 'div', variant: undefined },
      { element: <Span variant="badge">Badge</Span>, expectedTag: 'span', variant: 'badge' },
      { element: <Span>Plain</Span>, expectedTag: 'span', variant: undefined },
      { element: <Table variant="striped" />, expectedTag: 'table', variant: 'striped' },
      { element: <Table />, expectedTag: 'table', variant: undefined },
    ]

    for (const { element, expectedTag, variant } of cases) {
      const html = renderToStaticMarkup(element)

      // Must render with the correct HTML tag
      expect(html).toContain(`<${expectedTag}`)

      if (variant) {
        // Must project data-variant="value"
        expect(html).toContain(`data-variant="${variant}"`)
      } else {
        // Must NOT render data-variant when undefined
        expect(html).not.toContain('data-variant')
      }

      // CRITICAL: The raw prop `variant="..."` must NEVER leak to the DOM
      expect(html).not.toMatch(/\s+variant=/)
    }
  })
})