import { expect, test, type Page } from '@playwright/test'

async function openReference(page: Page, name: string) {
  await page.goto(`/?name=${encodeURIComponent(name)}`)
  await expect(page.getByTestId('reference-root')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Reference UI reference matrix' }),
  ).toBeVisible()
  await expect(page.getByTestId('reference-selected-name')).toHaveText(name)
}

test.describe('reference contract', () => {
  test('renders manifest-backed interface members and unions from generated reference artifacts', async ({ page }) => {
    await openReference(page, 'ReferenceApiFixture')

    await expect(page.getByText('ReferenceApiFixture').first()).toBeVisible()
    await expect(page.getByText('Interface').first()).toBeVisible()
    await expect(page.getByText('label', { exact: true })).toBeVisible()
    await expect(page.getByText('disabled', { exact: true })).toBeVisible()
    await expect(page.getByText('variant', { exact: true })).toBeVisible()
    await expect(page.getByText('Union').first()).toBeVisible()
    await expect(page.getByText('solid').first()).toBeVisible()
    await expect(page.getByText('ghost').first()).toBeVisible()
  })

  test('renders the generated public StyleProps symbol in the browser', async ({ page }) => {
    await openReference(page, 'StyleProps')

    await expect(page.getByText('StyleProps').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('WebkitAppearance').first()).toBeVisible()
    await expect(page.getByText('container').first()).toBeVisible()
    await expect(page.getByText(/Failed to load/)).toHaveCount(0)
  })

  test('renders inherited StyleProps members for local extending fixtures', async ({ page }) => {
    await openReference(page, 'ReferenceStylePropsExtendsFixture')

    await expect(page.getByText('ReferenceStylePropsExtendsFixture').first()).toBeVisible()
    await expect(page.getByText('WebkitAppearance').first()).toBeVisible()
    await expect(page.getByText('localTone').first()).toBeVisible()
    await expect(page.getByText(/Failed to load/)).toHaveCount(0)
  })

  test('shows inherited sections when a referenced type alias contributes members', async ({ page }) => {
    await openReference(page, 'ReferenceStylePropsTypeExtendsFixture')

    await expect(page.getByText('ReferenceStylePropsTypeExtendsFixture').first()).toBeVisible()
    await expect(
      page.getByText(/Inherited from\s*ReferenceStylePropsTypeBaseFixture\s*\(\d+\)/).first(),
    ).toBeVisible()
    await expect(page.getByText('localTone').first()).toBeVisible()
    await expect(page.getByText(/Failed to load/)).toHaveCount(0)
  })

  test('renders complex interface docs in a real consumer browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceButtonProps')

    await expect(page.getByText('DocsReferenceButtonProps').first()).toBeVisible()
    await expect(
      page.getByText('Public button props used to exercise the live reference table.'),
    ).toBeVisible()
    await expect(page.getByText('variant', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('size', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('padding', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('currentIntent', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('resolvedSize', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('iconPosition', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('toneKey', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('resolvedTone', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('toneLabels', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('spacingPreview', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('variantMeta', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('renderIcon', { exact: true })).toBeVisible()
    await expect(page.getByText('[inline: number, block: number]').first()).toBeVisible()
    await expect(page.getByText('tone-solid').first()).toBeVisible()
    await expect(page.getByText('tone-ghost').first()).toBeVisible()
    await expect(page.getByText('tone-outline').first()).toBeVisible()
    await expect(page.getByText('{ [K in DocsReferenceButtonVariant as `tone-${K}`]: K }').first()).toBeVisible()
    await expect(page.getByText('{ compact: 4; comfortable: 8; spacious: 12 }').first()).toBeVisible()
    await expect(
      page.getByText("{ emphasis: 'high'; fill: true } | { emphasis: 'low'; fill: false }").first(),
    ).toBeVisible()
    await expect(page.getByText('solid').first()).toBeVisible()
    await expect(page.getByText('md').first()).toBeVisible()
    await expect(page.getByText('start').first()).toBeVisible()
    await expect(page.getByText('end').first()).toBeVisible()
    await expect(
      page.getByText('(event: DocsReferencePressEvent, state: DocsReferenceButtonState) => void').first(),
    ).toBeVisible()
    await expect(
      page.getByText('(icon: DocsReferenceIconName, size: DocsReferenceButtonSize) => string').first(),
    ).toBeVisible()
    await expect(page.getByText('(value: string) => string').first()).toBeVisible()
    await expect(page.getByText('param', { exact: true })).toHaveCount(5)
    await expect(page.getByText('Pointer event metadata from the trigger interaction.').first()).toBeVisible()
    await expect(page.getByText('Snapshot of the button state at click time.').first()).toBeVisible()
    await expect(page.getByText('Resolved button size.').first()).toBeVisible()
    await expect(page.getByText('Current label text.').first()).toBeVisible()
    await expect(page.getByText('returns', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Rendered icon markup.').first()).toBeVisible()
    await expect(page.getByText('see', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('example', { exact: true }).first()).toBeVisible()
    await expect(page.getByText("renderIcon('plus', 'md')").first()).toBeVisible()
    await expect(page.getByText('deprecated', { exact: true })).toBeVisible()
    await expect(page.getByText('Prefer a direct render override.').first()).toBeVisible()
    await expect(page.getByText('remarks', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Useful for exercising non-param JSDoc tags in the browser.').first()).toBeVisible()
    await expect(page.getByText("DocsReferenceButtonState['intent']").first()).toBeVisible()
    await expect(page.getByText('primary').first()).toBeVisible()
    await expect(page.getByText('danger').first()).toBeVisible()
    await expect(page.getByText(/^mapped$/)).toHaveCount(0)
    await expect(page.getByText('[tuple]')).toHaveCount(0)
    await expect(page.getByText(/^conditional$/)).toHaveCount(0)
    await expect(page.getByText(/^indexed$/)).toHaveCount(0)
  })

  test('renders top-level literal-union aliases without placeholder fallback text', async ({ page }) => {
    await openReference(page, 'DocsReferenceButtonIntent')

    await expect(page.getByText('DocsReferenceButtonIntent').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText("'primary' | 'danger'").first()).toBeVisible()
  })

  test('renders standalone and derived literal-union alias pages without placeholder fallback text', async ({ page }) => {
    await openReference(page, 'DocsReferenceSimpleType')

    await expect(page.getByText('DocsReferenceSimpleType').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText("'a' | 'b'").first()).toBeVisible()
    await expect(page.getByText('Optional formatter for the visible label.')).toHaveCount(0)

    await openReference(page, 'DocsReferenceToneKey')

    await expect(page.getByText('DocsReferenceToneKey').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText("'tone-solid' | 'tone-ghost' | 'tone-outline'").first()).toBeVisible()

    await openReference(page, 'DocsReferenceResolvedSize')

    await expect(page.getByText('DocsReferenceResolvedSize').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText("'sm' | 'md' | 'lg'").first()).toBeVisible()

    await openReference(page, 'DocsReferenceResolvedTone')

    await expect(page.getByText('DocsReferenceResolvedTone').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText("'tone-sm' | 'tone-md' | 'tone-lg'").first()).toBeVisible()
  })

  test('renders tuple aliases with element labels instead of tuple placeholders', async ({ page }) => {
    await openReference(page, 'DocsReferenceButtonPadding')

    await expect(page.getByText('DocsReferenceButtonPadding').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('[inline: number, block: number]').first()).toBeVisible()
    await expect(page.getByText('[tuple]')).toHaveCount(0)
  })

  test('renders inherited origin labels across composed interfaces in the browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceSplitButtonProps')

    await expect(page.getByText('DocsReferenceSplitButtonProps').first()).toBeVisible()
    await expect(page.getByText('Interface').first()).toBeVisible()
    await expect(
      page.getByText(/Extends\s*DocsReferenceButtonProps, DocsReferencePressableProps/).first(),
    ).toBeVisible()
    await expect(page.getByText('label', { exact: true })).toBeVisible()
    await expect(page.getByText('controlId', { exact: true })).toBeVisible()
    await expect(page.getByText('interactionRole', { exact: true })).toBeVisible()
    await expect(page.getByText('announceLabel', { exact: true })).toBeVisible()
    await expect(page.getByText('hasMenu', { exact: true })).toBeVisible()
    await expect(page.getByText(/Inherited from\s*DocsReferenceButtonProps\s*\(\d+\)/).first()).toBeVisible()
    await expect(page.getByText(/Inherited from\s*DocsReferencePressableProps\s*\(\d+\)/).first()).toBeVisible()
    await expect(page.getByText(/Inherited from\s*DocsReferenceControlBaseProps\s*\(\d+\)/).first()).toBeVisible()
    await expect(page.getByText('lg').first()).toBeVisible()
  })

  test('renders generic interface headers with constraints and defaults in the browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceAsyncState')

    await expect(page.getByText('DocsReferenceAsyncState').first()).toBeVisible()
    await expect(page.getByText('Interface').first()).toBeVisible()
    await expect(page.getByText(/Generics\s*TData extends string = DocsReferenceButtonVariant/).first()).toBeVisible()
    await expect(page.getByText('status', { exact: true })).toBeVisible()
    await expect(page.getByText('data', { exact: true })).toBeVisible()
    await expect(page.getByText('Union').first()).toBeVisible()
    await expect(page.getByText('idle').first()).toBeVisible()
    await expect(page.getByText('loading').first()).toBeVisible()
    await expect(page.getByText('success').first()).toBeVisible()
  })

  test('renders mapped and object-like alias pages without raw placeholder fallbacks', async ({ page }) => {
    await openReference(page, 'DocsReferenceToneLabels')

    await expect(page.getByText('DocsReferenceToneLabels').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('{ [K in DocsReferenceButtonVariant as `tone-${K}`]: K }').first()).toBeVisible()
    await expect(page.getByText(/^mapped$/)).toHaveCount(0)

    await openReference(page, 'DocsReferenceSpacingPreview')

    await expect(page.getByText('DocsReferenceSpacingPreview').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('compact', { exact: true })).toBeVisible()
    await expect(page.getByText('comfortable', { exact: true })).toBeVisible()
    await expect(page.getByText('spacious', { exact: true })).toBeVisible()
    await expect(page.getByText('Definition')).toHaveCount(0)
  })

  test('renders discriminated union aliases with visible object branches in the browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceInteractiveElement')

    await expect(page.getByText('DocsReferenceInteractiveElement').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(
      page.getByText("{ kind: 'action'; onPress: () => void; disabled?: boolean } | { kind: 'link'; href: string; target?: '_self' | '_blank' }").first(),
    ).toBeVisible()
  })

  test('renders concrete conditional aliases as resolved unions in the browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceButtonVariantMeta')

    await expect(page.getByText('DocsReferenceButtonVariantMeta').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(
      page.getByText("{ emphasis: 'high'; fill: true } | { emphasis: 'low'; fill: false }").first(),
    ).toBeVisible()
  })

  test('renders typeof aliases as projected member tables when the resolved shape is object-like', async ({ page }) => {
    await openReference(page, 'DocsReferenceButtonSpacing')

    await expect(page.getByText('DocsReferenceButtonSpacing').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('compact', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('comfortable', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('spacious', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Definition')).toHaveCount(0)
  })

  test('renders JSDoc-tagged local interface pages without browser load failures', async ({ page }) => {
    await openReference(page, 'ReferenceJsDocTagFixture')

    await expect(page.getByText('ReferenceJsDocTagFixture').first()).toBeVisible()
    await expect(page.getByText('Interface').first()).toBeVisible()
    await expect(page.getByText('formatPreview', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('renderLabel', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('deprecated', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('remarks', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Failed to load/)).toHaveCount(0)
  })

  test('renders projected members for composed aliases in the browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceComposedButtonProps')

    await expect(page.getByText('DocsReferenceComposedButtonProps').first()).toBeVisible()
    await expect(page.getByText('label', { exact: true })).toBeVisible()
    await expect(page.getByText('controlId', { exact: true })).toBeVisible()
    await expect(page.getByText('interactionRole', { exact: true })).toBeVisible()
    await expect(page.getByText('Definition')).toHaveCount(0)
  })

  test('keeps direct alias targets definition-first instead of expanding members', async ({ page }) => {
    await openReference(page, 'DocsReferencePinnedTargetAlias')

    await expect(page.getByText('DocsReferencePinnedTargetAlias').first()).toBeVisible()
    await expect(page.getByText('DocsReferencePinnedTarget').first()).toBeVisible()
    await expect(page.getByText('Definition')).toBeVisible()
    await expect(page.getByText('label')).toHaveCount(0)
  })

  test('shows a readable browser error when the requested symbol does not exist', async ({ page }) => {
    await openReference(page, 'ReferenceMissingSymbolFixture')

    const errorMessage = page.getByText(/Failed to load/)
    await expect(errorMessage).toContainText('ReferenceMissingSymbolFixture')
  })
})