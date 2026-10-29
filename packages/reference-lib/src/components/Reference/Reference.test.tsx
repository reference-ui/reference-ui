/**
 * Proof for the Reference server-rendering contracts. Pins runtime
 * installation with a loading state and no fetch during SSR, explicit
 * failure without a provider, loading/empty distinction, escaped error
 * text, and memberless aliases showing their type definition. Member rows
 * pin the labelled default line, inline code spans, and dropped empty params.
 */
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ReferenceDocument as DocumentData } from '@reference-ui/types'
import { Reference, ReferenceView } from './index'
import { ReferenceEmptyState, ReferenceErrorState, ReferenceLoadingState } from './ReferenceStatus'
import { ReferenceDocument } from './document/ReferenceDocument'
import { ReferenceMemberRow } from './components/ReferenceMemberRow'
import { isCodeLiteralDefault } from './components/MemberDefault'
import { splitInlineCode } from './components/shared/InlineCode'

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

  it('a union alias whose branches merged into members renders the member list, not its definition', () => {
    const merged = {
      ...document('typeAlias', 'BranchA | BranchB'),
      members: [member({ name: 'mode', optional: false, typeLabel: 'Union' }), member({ id: 'm2', name: 'onPick' })],
    }
    const html = renderToStaticMarkup(<ReferenceDocument document={merged} />)
    expect(html).toContain('mode')
    expect(html).toContain('onPick')
    expect(html).not.toContain('BranchA | BranchB')
    expect(html).not.toContain('Definition')
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

type MemberData = DocumentData['members'][number]

function member(overrides: Partial<MemberData> & { description?: string; paramDocs?: MemberData['summary']['paramDocs'] }): MemberData {
  const { description, paramDocs, ...rest } = overrides
  const origin = { id: 'o', name: 'Origin' } as MemberData['declaredBy']
  return {
    id: 'm1', name: 'open', kind: 'property', optional: true, readonly: false,
    declaredBy: origin, semanticKind: 'property', typeLabel: 'boolean',
    jsDoc: { tags: [] },
    summary: { description, paramDocs: paramDocs ?? [] },
    ...rest,
  } as MemberData
}

describe('Reference member rows', () => {
  it('labels a code-literal default and renders it as code', () => {
    const html = renderToStaticMarkup(<ReferenceMemberRow member={member({ defaultValue: 'false' })} />)
    expect(html).toContain('Default')
    expect(html).toContain('false')
  })

  it('renders a prose default with inline code and escapes it', () => {
    const html = renderToStaticMarkup(
      <ReferenceMemberRow member={member({ defaultValue: "the root's `disabled` <b>" })} />,
    )
    expect(html).toContain('Default')
    expect(html).toContain('the root&#x27;s ')
    expect(html).toMatch(/<code[^>]*>disabled<\/code>/)
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('`')
  })

  it('shows no default line when the member has no default', () => {
    const html = renderToStaticMarkup(<ReferenceMemberRow member={member({})} />)
    expect(html).not.toContain('Default')
  })

  it('classifies code literals versus prose defaults', () => {
    for (const literal of ['0', '-1.5', 'true', 'false', 'null', 'undefined', '"solid"', "'a'", '"two words"', '[]', '{}', 'bottom']) {
      expect(isCodeLiteralDefault(literal)).toBe(true)
    }
    for (const prose of ['a chevron icon', "the root's `disabled`", 'true when open', '']) {
      expect(isCodeLiteralDefault(prose)).toBe(false)
    }
  })

  it('splits backtick spans into code parts and leaves unpaired backticks literal', () => {
    expect(splitInlineCode('Pass `null` to hide `it`.')).toEqual([
      { kind: 'text', value: 'Pass ' },
      { kind: 'code', value: 'null' },
      { kind: 'text', value: ' to hide ' },
      { kind: 'code', value: 'it' },
      { kind: 'text', value: '.' },
    ])
    expect(splitInlineCode('stray ` tick')).toEqual([{ kind: 'text', value: 'stray ` tick' }])
    expect(splitInlineCode('empty `` pair')).toEqual([{ kind: 'text', value: 'empty `` pair' }])
  })

  it('renders description backticks as inline code and never as markup', () => {
    const html = renderToStaticMarkup(
      <ReferenceMemberRow member={member({ description: 'Return `false` to cancel <i>x</i>.' })} />,
    )
    expect(html).toMatch(/<code[^>]*>false<\/code>/)
    expect(html).toContain('&lt;i&gt;x&lt;/i&gt;')
    expect(html).not.toContain('`')
  })

  it('drops param rows without a description and keeps documented ones', () => {
    const html = renderToStaticMarkup(
      <ReferenceMemberRow
        member={member({
          paramDocs: [
            { name: 'nextState', optional: false },
            { name: 'reason', optional: false, description: 'Why it changed.' },
          ] as MemberData['summary']['paramDocs'],
        })}
      />,
    )
    expect(html).not.toContain('nextState')
    expect(html).toContain('reason')
    expect(html).toContain('Why it changed.')
  })

  it('shows no JSDoc block when every param is undocumented', () => {
    const html = renderToStaticMarkup(
      <ReferenceMemberRow
        member={member({ paramDocs: [{ name: 'open', optional: false }] as MemberData['summary']['paramDocs'] })}
      />,
    )
    expect(html).not.toContain('param')
  })
})
