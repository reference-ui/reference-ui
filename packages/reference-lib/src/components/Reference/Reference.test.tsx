import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ReferenceDocument as DocumentData } from '@reference-ui/types'
import { Reference, ReferenceView } from './index'
import { ReferenceEmptyState, ReferenceErrorState, ReferenceLoadingState } from './ReferenceStatus'
import { ReferenceDocument } from './document/ReferenceDocument'

function document(kind: DocumentData['kind'], definition: string | null): DocumentData {
  return {
    id: 'reference-contract', name: 'ContractType', kind,
    kindLabel: kind === 'typeAlias' ? 'type alias' : 'interface',
    warnings: [], jsDoc: { tags: [] }, typeParameters: [], typeParameterDetails: [],
    extendsNames: [], extends: [], types: [], definition, definitionType: null, members: [],
  }
}

describe('Reference server rendering contracts', () => {
  it('public Reference installs its runtime and renders a loading state without fetching during SSR', () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }))
    try {
      const html = renderToStaticMarkup(<Reference name="ContractType" />)
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(html).toContain('Loading reference docs for')
      expect(html).toContain('ContractType')
      expect(html).not.toContain('Failed to load')
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('ReferenceView fails explicitly when its runtime provider is missing', () => {
    expect(() => renderToStaticMarkup(<ReferenceView name="ContractType" />))
      .toThrow('ReferenceRuntimeProvider is required')
  })

  it('loading and empty states distinguish pending work from an absent document', () => {
    const loading = renderToStaticMarkup(<ReferenceLoadingState name="ContractType" />)
    const empty = renderToStaticMarkup(<ReferenceEmptyState name="ContractType" />)
    expect(loading).toContain('Loading reference docs for')
    expect(loading).not.toContain('No reference document')
    expect(empty).toContain('No reference document was produced for')
    expect(empty).not.toContain('Loading reference docs')
    expect(empty).toContain('ContractType')
  })

  it('runtime errors and requested names are rendered as escaped text', () => {
    const html = renderToStaticMarkup(
      <ReferenceErrorState name={'<script>name</script>'} errorMessage={'<img src=x onerror=alert(1)>'} />,
    )
    expect(html).toContain('Failed to load')
    expect(html).toContain('&lt;script&gt;name&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
  })

  it('memberless aliases show their type definition rather than an empty interface notice', () => {
    const html = renderToStaticMarkup(<ReferenceDocument document={document('typeAlias', 'string | number')} />)
    expect(html).toContain('ContractType')
    expect(html).toContain('type alias')
    expect(html).toContain('Definition')
    expect(html).toContain('string | number')
    expect(html).not.toContain('No members were emitted')
  })

  it('memberless interfaces show an explicit empty member notice rather than the alias definition', () => {
    const html = renderToStaticMarkup(<ReferenceDocument document={document('interface', 'ignored-definition')} />)
    expect(html).toContain('ContractType')
    expect(html).toContain('No members were emitted for this interface.')
    expect(html).not.toContain('ignored-definition')
    expect(html).not.toContain('Definition')
  })

  it('a missing alias definition falls back to unknown and escapes authored definition text', () => {
    const missing = renderToStaticMarkup(<ReferenceDocument document={document('typeAlias', null)} />)
    const authored = renderToStaticMarkup(<ReferenceDocument document={document('typeAlias', '<script>unsafe</script>')} />)
    expect(missing).toContain('unknown')
    expect(authored).toContain('&lt;script&gt;unsafe&lt;/script&gt;')
    expect(authored).not.toContain('<script>')
  })
})
