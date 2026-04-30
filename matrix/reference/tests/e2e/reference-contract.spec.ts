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
  test('renders complex interface docs in a real consumer browser', async ({ page }) => {
    await openReference(page, 'DocsReferenceButtonProps')

    await expect(page.getByText('DocsReferenceButtonProps').first()).toBeVisible()
    await expect(
      page.getByText('Public button props used to exercise the live reference table.'),
    ).toBeVisible()
    await expect(page.getByText('renderIcon', { exact: true })).toBeVisible()
    await expect(page.getByText('tone-solid').first()).toBeVisible()
    await expect(page.getByText('deprecated', { exact: true })).toBeVisible()
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