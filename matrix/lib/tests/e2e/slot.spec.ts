import { expect, test } from '@playwright/test'

test.describe('Slot Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slot')
    await expect(page.getByTestId('slot-fixture-root')).toBeVisible()
  })

  test('SL-COMP-01: A host renders registered parts in named regions when fillers commit first', async ({
    page,
  }) => {
    const header = page.getByTestId('region-header')
    const footer = page.getByTestId('region-footer')

    await expect(header.getByTestId('slotted-title')).toHaveText('Initial Title')
    await expect(footer.getByTestId('btn-action-primary')).toBeVisible()
    await expect(footer.getByTestId('btn-action-secondary')).toBeVisible()
  })

  test('SL-COMP-02: A host refreshes slotted content on an in-place rerender without a remount key', async ({
    page,
  }) => {
    const slottedTitle = page.getByTestId('slotted-title')
    await expect(slottedTitle).toHaveText('Initial Title')

    const initialMountCount = await slottedTitle.getAttribute('data-mount-count')
    expect(initialMountCount).toBeTruthy()

    await page.getByTestId('btn-update-title').click()

    await expect(slottedTitle).toHaveText('Updated Title')
    // Mount count must remain unchanged (proves no remount occurred)
    await expect(slottedTitle).toHaveAttribute('data-mount-count', initialMountCount!)
  })

  test('SL-COMP-03: A host scans a prefix of slot ids when several entries share a region kind', async ({
    page,
  }) => {
    const header = page.getByTestId('region-header')
    const footer = page.getByTestId('region-footer')

    await expect(header).toHaveAttribute(
      'data-cache-key',
      'actions.primary,actions.secondary'
    )
    await expect(footer.getByTestId('btn-action-primary')).toBeVisible()
    await expect(footer.getByTestId('btn-action-secondary')).toBeVisible()
  })

  test('SL-COMP-04: A host honors resolveSlotVisibility without unregistering', async ({
    page,
  }) => {
    const headerContainer = page.getByTestId('header-container')
    const registeredCount = page.getByTestId('registered-count')

    // Initial: 3 registered (title, action1, action2)
    await expect(registeredCount).toHaveText('3')
    await expect(headerContainer).toBeVisible()

    // 1. Set Hidden -> display: none, stays mounted, not unregistered
    await page.getByTestId('btn-set-hidden').click()
    await expect(headerContainer).toBeHidden()
    await expect(registeredCount).toHaveText('3')

    // 2. Set Unmounted -> removed from DOM, not unregistered
    await page.getByTestId('btn-set-unmounted').click()
    await expect(page.getByTestId('header-container')).toHaveCount(0)
    await expect(registeredCount).toHaveText('3')

    // 3. Set Visible -> re-renders visible with current live text
    await page.getByTestId('btn-set-visible').click()
    await expect(page.getByTestId('header-container')).toBeVisible()
    await expect(page.getByTestId('slotted-title')).toHaveText('Initial Title')
    await expect(registeredCount).toHaveText('3')
  })
})
