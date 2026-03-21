/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Reference } from '@reference-ui/types'
import { waitForReferenceArtifacts } from './helpers'

async function renderReference(name: string) {
  const ready = await waitForReferenceArtifacts()
  expect(ready, 'reference manifest should be emitted by the reference worker').toBe(true)

  render(<Reference name={name} />)
  await waitFor(() => {
    expect(screen.queryByText(/Loading reference docs for/)).not.toBeInTheDocument()
  })
}

function expectVisibleText(text: string | RegExp) {
  expect(screen.getAllByText(text).length).toBeGreaterThanOrEqual(1)
}

describe('Reference component', () => {
  it('loads symbol metadata from the generated Tasty manifest at runtime', async () => {
    await renderReference('ReferenceApiFixture')

    expect(screen.getByText('Interface')).toBeInTheDocument()
    expect(screen.getByText('ReferenceApiFixture')).toBeInTheDocument()
    expect(screen.getByText('label')).toBeInTheDocument()
    expect(screen.getByText('disabled')).toBeInTheDocument()
    expect(screen.getByText('variant')).toBeInTheDocument()
    expect(screen.getByText("'solid' | 'ghost'")).toBeInTheDocument()
    expectVisibleText('solid')
    expectVisibleText('ghost')
  })

  it('renders the richer docs reference fixture with defaults, callbacks, and derived types', async () => {
    await renderReference('DocsReferenceButtonProps')

    expect(screen.getByText('DocsReferenceButtonProps')).toBeInTheDocument()
    expect(
      screen.getByText(/Public button props used to exercise the live reference table\./),
    ).toBeInTheDocument()

    expectVisibleText('variant')
    expectVisibleText('size')
    expectVisibleText('padding')
    expectVisibleText('currentIntent')
    expectVisibleText('iconPosition')
    expectVisibleText('toneKey')
    expectVisibleText('toneLabels')
    expectVisibleText('spacingPreview')
    expectVisibleText('variantMeta')
    expectVisibleText('renderIcon')
    expectVisibleText("'start' | 'end'")
    expectVisibleText('[inline: number, block: number]')
    expectVisibleText('`tone-${DocsReferenceButtonVariant}`')
    expectVisibleText('{ [K in DocsReferenceButtonVariant as `tone-${K}`]: K }')
    expectVisibleText('{ compact: 4; comfortable: 8; spacious: 12 }')
    expectVisibleText(
      "T extends 'solid' ? { emphasis: 'high'; fill: true } : { emphasis: 'low'; fill: false }",
    )

    expect(screen.getAllByText('@default').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('"solid"')).toBeInTheDocument()
    expect(screen.getByText('"md"')).toBeInTheDocument()
    expect(screen.getByText('"start"')).toBeInTheDocument()

    expect(
      screen.getByText('(event: DocsReferencePressEvent, state: DocsReferenceButtonState) => void'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('(icon: DocsReferenceIconName, size: DocsReferenceButtonSize) => string'),
    ).toBeInTheDocument()
    expect(screen.getByText('(value: string) => string')).toBeInTheDocument()

    expect(screen.getAllByText('@param').length).toBeGreaterThanOrEqual(5)
    expectVisibleText('Pointer event metadata from the trigger interaction.')
    expectVisibleText('Snapshot of the button state at click time.')
    expectVisibleText('Resolved button size.')
    expectVisibleText('Current label text.')

    expectVisibleText('@returns')
    expectVisibleText('Rendered icon markup.')
    expectVisibleText('@see')
    expectVisibleText("@example")
    expectVisibleText("renderIcon('plus', 'md')")
    expectVisibleText('@deprecated')
    expectVisibleText('Prefer a direct render override.')
    expectVisibleText('@remarks')
    expectVisibleText('Useful for exercising non-param JSDoc tags in the browser.')

    expect(screen.getByText("DocsReferenceButtonState['intent']")).toBeInTheDocument()
    expectVisibleText('keyof typeof docsReferenceTheme.intents')
    expect(screen.queryByText((content) => content === 'mapped')).not.toBeInTheDocument()
    expect(screen.queryByText('[tuple]')).not.toBeInTheDocument()
    expect(screen.queryByText((content) => content === 'conditional')).not.toBeInTheDocument()
    expect(screen.queryByText('indexed')).not.toBeInTheDocument()
  })

  it('renders type alias fixtures so resolution-focused scenarios are testable in isolation', async () => {
    await renderReference('DocsReferenceCurrentIntent')

    expect(screen.getByText('DocsReferenceCurrentIntent')).toBeInTheDocument()
    expect(screen.getByText('Type alias')).toBeInTheDocument()
    expect(screen.getByText("DocsReferenceButtonProps['currentIntent']")).toBeInTheDocument()
  })

  it('renders tuple aliases with their element labels instead of placeholder text', async () => {
    await renderReference('DocsReferenceButtonPadding')

    expect(screen.getByText('DocsReferenceButtonPadding')).toBeInTheDocument()
    expect(screen.getByText('Type alias')).toBeInTheDocument()
    expectVisibleText('[inline: number, block: number]')
    expect(screen.queryByText('[tuple]')).not.toBeInTheDocument()
  })

  it('renders template literal aliases with the full template expression', async () => {
    await renderReference('DocsReferenceToneKey')

    expect(screen.getByText('DocsReferenceToneKey')).toBeInTheDocument()
    expect(screen.getByText('Type alias')).toBeInTheDocument()
    expectVisibleText('`tone-${DocsReferenceButtonVariant}`')
    expect(screen.queryByText('template literal')).not.toBeInTheDocument()
  })

  it('renders object aliases with their member previews', async () => {
    await renderReference('DocsReferenceSpacingPreview')

    expect(screen.getByText('DocsReferenceSpacingPreview')).toBeInTheDocument()
    expect(screen.getByText('Type alias')).toBeInTheDocument()
    expectVisibleText('{ compact: 4; comfortable: 8; spacious: 12 }')
  })

  it('renders typeof aliases in their declared form when tasty has no resolved object shape', async () => {
    await renderReference('DocsReferenceButtonSpacing')

    expect(screen.getByText('DocsReferenceButtonSpacing')).toBeInTheDocument()
    expect(screen.getByText('Type alias')).toBeInTheDocument()
    expectVisibleText('typeof docsReferenceTheme.spacing')
  })

})
