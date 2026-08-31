import { expect, test } from '@playwright/test'

test.describe('ReferenceLibrary Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reference-library')
    await expect(page.getByTestId('ref-library-fixture-root')).toBeVisible()
  })

  test('RL-DOM-01 & RL-ROOT-01: Renders application transparently and elects earliest live mount as active host', async ({
    page,
  }) => {
    // Both application roots are visible
    await expect(page.getByTestId('app-primary')).toBeVisible()
    await expect(page.getByTestId('app-standby')).toBeVisible()

    // Active toast host is rendered ONLY under root-primary (the earliest mount)
    const primaryToastHost = page
      .getByTestId('root-primary')
      .locator('[data-reference-toast-host]')
    const standbyToastHost = page
      .getByTestId('root-standby')
      .locator('[data-reference-toast-host]')

    await expect(primaryToastHost).toHaveCount(1)
    await expect(standbyToastHost).toHaveCount(0)
  })

  test('RL-DOM-02 & RL-LIFE-03: Displays imperative toast in active host and updates live regions', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-toast').click()

    const toastItem = page.locator('[data-toast-id="toast-save"]')
    await expect(toastItem).toBeVisible()
    await expect(toastItem).toHaveText('Saved Draft Successfully')

    await page.getByTestId('btn-announce').click()
    const politeAnnouncer = page.getByTestId('polite-announcer')
    await expect(politeAnnouncer).toHaveText('File uploaded completely')
  })

  test('RL-ROOT-03: Fails over active host to standby when primary host unmounts', async ({
    page,
  }) => {
    // Show toast
    await page.getByTestId('btn-show-toast').click()
    await expect(page.locator('[data-toast-id="toast-save"]')).toBeVisible()

    // Unmount primary root
    await page.getByTestId('btn-toggle-primary').click()

    // Toast host now fails over to root-standby
    const standbyToastHost = page
      .getByTestId('root-standby')
      .locator('[data-reference-toast-host]')

    await expect(standbyToastHost).toHaveCount(1)
    await expect(standbyToastHost.locator('[data-toast-id="toast-save"]')).toBeVisible()
  })
})
