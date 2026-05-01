/**
 * @vitest-environment happy-dom
 */

import { cleanup, render, screen, within } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Reference } from '@reference-ui/types'
import { waitForReferenceArtifacts } from './helpers'

async function renderReference(name: string) {
  const ready = await waitForReferenceArtifacts()
  expect(ready, 'reference manifest should be emitted by the reference worker').toBe(true)

  const view = render(<Reference name={name} />)
  await waitFor(() => {
    expect(within(view.container).queryByText(/Loading reference docs for/)).not.toBeInTheDocument()
  })
}

function expectVisibleText(text: string | RegExp) {
  const options = typeof text === 'string' ? { exact: false as const } : undefined
  expect(screen.getAllByText(text, options).length).toBeGreaterThanOrEqual(1)
}

function expectVisibleTextContent(text: string | RegExp) {
  const matcher = typeof text === 'string'
    ? (content: string) => content.includes(text)
    : (content: string) => text.test(content)

  expect(
    screen.getAllByText((_, element) => {
      const content = normalizeVisibleText(element?.textContent ?? '')
      return content.length > 0 && matcher(content)
    }).length,
  ).toBeGreaterThanOrEqual(1)
}

function expectTextAbsent(text: string | RegExp) {
  expect(screen.queryByText(text)).not.toBeInTheDocument()
}

function normalizeVisibleText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

describe('Reference component', () => {
  afterEach(() => {
    cleanup()
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('loads symbol metadata from the generated Tasty manifest at runtime', async () => {
    await renderReference('ReferenceApiFixture')

    expect(screen.getByText('Interface')).toBeInTheDocument()
    expect(screen.getByText('ReferenceApiFixture')).toBeInTheDocument()
    expect(screen.getByText('label')).toBeInTheDocument()
    expect(screen.getByText('disabled')).toBeInTheDocument()
    expect(screen.getByText('variant')).toBeInTheDocument()
    expect(screen.getByText('Union')).toBeInTheDocument()
    expectVisibleText('solid')
    expectVisibleText('ghost')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders the generated public StyleProps symbol', async () => {
    await renderReference('StyleProps')

    expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument()
    expect(screen.getByText('StyleProps')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('WebkitAppearance')).toBeInTheDocument()
    expect(screen.getByText('container')).toBeInTheDocument()
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders inherited StyleProps members for interfaces that extend StyleProps', async () => {
    await renderReference('ReferenceStylePropsExtendsFixture')

    expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument()
    expect(screen.getByText('ReferenceStylePropsExtendsFixture')).toBeInTheDocument()
    expect(screen.getByText('WebkitAppearance')).toBeInTheDocument()
    expect(screen.getByText('localTone')).toBeInTheDocument()
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('groups referenced type-alias members as inherited sections', async () => {
    await renderReference('ReferenceStylePropsTypeExtendsFixture')

    expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument()
    expect(screen.getByText('ReferenceStylePropsTypeExtendsFixture')).toBeInTheDocument()
    expectVisibleTextContent(/Inherited from\s*ReferenceStylePropsTypeBaseFixture\s*\(\d+\)/)
    expect(screen.getByText('localTone')).toBeInTheDocument()
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders the richer docs reference fixture with defaults, callbacks, and derived types', async () => {
    await renderReference('DocsReferenceButtonProps')

    expect(screen.getByText('DocsReferenceButtonProps')).toBeInTheDocument()
    expect(
      screen.getByText(/Public button props used to exercise the live reference table\./)
    ).toBeInTheDocument()

    expectVisibleText('variant')
    expectVisibleText('size')
    expectVisibleText('padding')
    expectVisibleText('currentIntent')
    expectVisibleText('resolvedSize')
    expectVisibleText('iconPosition')
    expectVisibleText('toneKey')
    expectVisibleText('resolvedTone')
    expectVisibleText('toneLabels')
    expectVisibleText('spacingPreview')
    expectVisibleText('variantMeta')
    expectVisibleText('renderIcon')
    expectVisibleText('[inline: number, block: number]')
    expectVisibleText('tone-solid')
    expectVisibleText('tone-ghost')
    expectVisibleText('tone-outline')
    expectVisibleText('{ [K in DocsReferenceButtonVariant as `tone-${K}`]: K }')
    expectVisibleText('{ compact: 4; comfortable: 8; spacious: 12 }')
    expectVisibleText(
      "{ emphasis: 'high'; fill: true } | { emphasis: 'low'; fill: false }"
    )

    expectVisibleText('solid')
    expectVisibleText('md')
    expectVisibleText('start')
    expectVisibleText('end')

    expect(
      screen.getByText(
        '(event: DocsReferencePressEvent, state: DocsReferenceButtonState) => void'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '(icon: DocsReferenceIconName, size: DocsReferenceButtonSize) => string'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('(value: string) => string')).toBeInTheDocument()

    expect(screen.getAllByText('param').length).toBeGreaterThanOrEqual(5)
    expectVisibleText('Pointer event metadata from the trigger interaction.')
    expectVisibleText('Snapshot of the button state at click time.')
    expectVisibleText('Resolved button size.')
    expectVisibleText('Current label text.')

    expectVisibleText('returns')
    expectVisibleText('Rendered icon markup.')
    expectVisibleText('see')
    expectVisibleText('example')
    expectVisibleText("renderIcon('plus', 'md')")
    expectVisibleText('deprecated')
    expectVisibleText('Prefer a direct render override.')
    expectVisibleText('remarks')
    expectVisibleText('Useful for exercising non-param JSDoc tags in the browser.')

    expect(screen.getByText("DocsReferenceButtonState['intent']")).toBeInTheDocument()
    expectVisibleText('primary')
    expectVisibleText('danger')
    expect(screen.queryByText(content => content === 'mapped')).not.toBeInTheDocument()
    expect(screen.queryByText('[tuple]')).not.toBeInTheDocument()
    expect(
      screen.queryByText(content => content === 'conditional')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('indexed')).not.toBeInTheDocument()
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders type alias fixtures so resolution-focused scenarios are testable in isolation', async () => {
    await renderReference('DocsReferenceSimpleType')

    expect(screen.getByText('DocsReferenceSimpleType')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText("'a' | 'b'")
    expectTextAbsent('Optional formatter for the visible label.')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders projected members for composed type aliases in the reference UI', async () => {
    await renderReference('DocsReferenceComposedButtonProps')

    expect(screen.getByText('DocsReferenceComposedButtonProps')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('label')
    expectVisibleText('variant')
    expectVisibleText('controlId')
    expectVisibleText('interactionRole')
    expectVisibleText('announceLabel')
    expectTextAbsent('Definition')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders keyof typeof aliases as resolved literal unions when tasty emits them', async () => {
    await renderReference('DocsReferenceButtonIntent')

    expect(screen.getByText('DocsReferenceButtonIntent')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText("'primary' | 'danger'")
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders inherited members with origin labels', async () => {
    await renderReference('DocsReferenceSplitButtonProps')

    expect(screen.getByText('DocsReferenceSplitButtonProps')).toBeInTheDocument()
    expect(screen.getByText('Interface')).toBeInTheDocument()
    expectVisibleTextContent(/Extends\s*DocsReferenceButtonProps, DocsReferencePressableProps/)
    expectVisibleText('label')
    expectVisibleText('controlId')
    expectVisibleText('interactionRole')
    expectVisibleText('announceLabel')
    expectVisibleText('hasMenu')
    expectVisibleTextContent(/Inherited from\s*DocsReferenceButtonProps\s*\(\d+\)/)
    expectVisibleTextContent(/Inherited from\s*DocsReferencePressableProps\s*\(\d+\)/)
    expectVisibleTextContent(/Inherited from\s*DocsReferenceControlBaseProps\s*\(\d+\)/)
    expectVisibleText('lg')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders generic interface headers with constraints and defaults', async () => {
    await renderReference('DocsReferenceAsyncState')

    expect(screen.getByText('DocsReferenceAsyncState')).toBeInTheDocument()
    expect(screen.getByText('Interface')).toBeInTheDocument()
    expectVisibleTextContent(/Generics\s*TData extends string = DocsReferenceButtonVariant/)
    expectVisibleText('status')
    expectVisibleText('data')
    expect(screen.getByText('Union')).toBeInTheDocument()
    expectVisibleText('idle')
    expectVisibleText('loading')
    expectVisibleText('success')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders tuple aliases with their element labels instead of placeholder text', async () => {
    await renderReference('DocsReferenceButtonPadding')

    expect(screen.getByText('DocsReferenceButtonPadding')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('[inline: number, block: number]')
    expect(screen.queryByText('[tuple]')).not.toBeInTheDocument()
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders mapped aliases with the full mapped expression', async () => {
    await renderReference('DocsReferenceToneLabels')

    expect(screen.getByText('DocsReferenceToneLabels')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('{ [K in DocsReferenceButtonVariant as `tone-${K}`]: K }')
    expect(screen.queryByText(content => content === 'mapped')).not.toBeInTheDocument()
    expectTextAbsent('Last resolved payload when the state is successful.')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders template literal aliases as resolved literal unions when tasty emits them', async () => {
    await renderReference('DocsReferenceToneKey')

    expect(screen.getByText('DocsReferenceToneKey')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText("'tone-solid' | 'tone-ghost' | 'tone-outline'")
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders tuple-derived indexed access aliases as resolved literal unions', async () => {
    await renderReference('DocsReferenceResolvedSize')

    expect(screen.getByText('DocsReferenceResolvedSize')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText("'sm' | 'md' | 'lg'")
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders object-like aliases as member tables when projection exists', async () => {
    await renderReference('DocsReferenceSpacingPreview')

    expect(screen.getByText('DocsReferenceSpacingPreview')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('compact')
    expectVisibleText('comfortable')
    expectVisibleText('spacious')
    expectTextAbsent('Definition')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders intersection aliases as the final member surface when projection exists', async () => {
    await renderReference('DocsReferenceComposedButtonProps')

    expect(screen.getByText('DocsReferenceComposedButtonProps')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('label')
    expectVisibleText('controlId')
    expectTextAbsent('Last resolved payload when the state is successful.')
    expectTextAbsent('Definition')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders discriminated union aliases with their object branches', async () => {
    await renderReference('DocsReferenceInteractiveElement')

    expect(screen.getByText('DocsReferenceInteractiveElement')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText(
      "{ kind: 'action'; onPress: () => void; disabled?: boolean } | { kind: 'link'; href: string; target?: '_self' | '_blank' }"
    )
    expectTextAbsent('Last resolved payload when the state is successful.')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders concrete conditional aliases as resolved unions when tasty emits them', async () => {
    await renderReference('DocsReferenceButtonVariantMeta')

    expect(screen.getByText('DocsReferenceButtonVariantMeta')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText(
      "{ emphasis: 'high'; fill: true } | { emphasis: 'low'; fill: false }"
    )
    expectTextAbsent('Last resolved payload when the state is successful.')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders typeof aliases as member tables when the resolved shape is object-like', async () => {
    await renderReference('DocsReferenceButtonSpacing')

    expect(screen.getByText('DocsReferenceButtonSpacing')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('compact')
    expectVisibleText('comfortable')
    expectVisibleText('spacious')
    expectTextAbsent('Definition')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('renders tuple-derived template literal aliases as resolved literal unions', async () => {
    await renderReference('DocsReferenceResolvedTone')

    expect(screen.getByText('DocsReferenceResolvedTone')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText("'tone-sm' | 'tone-md' | 'tone-lg'")
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('keeps direct alias boundaries definition-first instead of expanding the target members', async () => {
    await renderReference('DocsReferencePinnedTargetAlias')

    expect(screen.getByText('DocsReferencePinnedTargetAlias')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expectVisibleText('DocsReferencePinnedTarget')
    expect(screen.getByText('Definition')).toBeInTheDocument()
    expectTextAbsent('label')
    expectTextAbsent('disabled')
  })

  // MIGRATED: Covered by matrix/reference/tests/e2e/reference-contract.spec.ts.
  it.skip('loads a local interface from the reference-unit source tree', async () => {
    await renderReference('ReferenceJsDocTagFixture')

    expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument()
    expect(screen.getAllByText('ReferenceJsDocTagFixture').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Interface')).toBeInTheDocument()
    expectVisibleText('formatPreview')
    expectVisibleText('renderLabel')
    expectVisibleText('deprecated')
    expectVisibleText('remarks')
  })
})
