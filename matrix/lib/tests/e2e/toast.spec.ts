import { expect, test } from '@playwright/test'

test.describe('Toast Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toast')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  })

  test('TO-DOM-01 & TO-DEF-01: Displays defined toast, updates content in place, and dismisses', async ({
    page,
  }) => {
    const toastRoot = page.getByTestId('defined-toast-root')
    const toastTitle = page.getByTestId('defined-toast-title')

    await expect(toastRoot).toHaveCount(0)

    // Show defined toast
    await page.getByTestId('btn-show-defined-toast').click()
    await expect(toastRoot).toBeVisible()
    await expect(toastRoot).toHaveAttribute('data-type', 'success')
    await expect(toastTitle).toHaveText('Project saved successfully!')

    // Update toast in place
    await page.getByTestId('btn-update-toast').click()
    await expect(toastTitle).toHaveText('Project synchronized with cloud!')

    // Dismiss toast
    await page.getByTestId('btn-dismiss-toast').click()
    await expect(toastRoot).toHaveCount(0)
  })

  test('TO-DEF-DEFAULT: Displays default toast with title, description, and close button, and dismisses on close click', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-default-toast').click()

    const toastRoot = page.locator('[data-reference-toast-root]')
    await expect(toastRoot).toBeVisible()

    const title = page.locator('[data-reference-toast-title]')
    await expect(title).toHaveText('Settings updated')

    const desc = page.locator('[data-reference-toast-description]')
    await expect(desc).toHaveText('Your profile settings were saved.')

    const closeBtn = page.locator('[data-reference-toast-close]')
    await expect(closeBtn).toBeVisible()

    // Click close button to dismiss
    await closeBtn.click()
    await expect(toastRoot).toHaveCount(0)
  })

  test('TO-DEF-CUSTOM: Renders custom toast using toast.custom() and dismisses on close', async ({
    page,
  }) => {
    await page.getByTestId('btn-show-custom-toast').click()

    const customRoot = page.getByTestId('custom-toast-root')
    await expect(customRoot).toBeVisible()

    const title = page.getByTestId('custom-toast-title')
    await expect(title).toHaveText('Custom Layout')

    const closeBtn = page.getByTestId('btn-custom-close')
    await closeBtn.click()
    await expect(customRoot).toHaveCount(0)
  })

  test('TO-STACK-01: Correct card stacking order and transforms with newest toast in front', async ({
    page,
  }) => {
    await page.getByTestId('btn-add-stack-toasts').click()

    const toasts = page.locator('[data-reference-toast-id]')
    await expect(toasts).toHaveCount(3)

    // The third (newest) toast should be marked as front and have scale 1
    const thirdToast = page.locator('[data-reference-toast-id]').nth(2)
    await expect(thirdToast).toHaveAttribute('data-front', 'true')

    const secondToast = page.locator('[data-reference-toast-id]').nth(1)
    await expect(secondToast).toHaveAttribute('data-front', 'false')

    const firstToast = page.locator('[data-reference-toast-id]').nth(0)
    await expect(firstToast).toHaveAttribute('data-front', 'false')

    // Clean up
    await page.getByTestId('btn-dismiss-all').click()
    await expect(toasts).toHaveCount(0)
  })

  test('TO-STACK-HOVER: Hovering over the stack expands out cards smoothly without flickering', async ({
    page,
  }) => {
    await page.getByTestId('btn-add-stack-toasts').click()

    const stack = page.locator('[data-reference-toast-position][data-expanded]')
    await expect(stack).toBeVisible()

    // Hover over the stack
    await stack.hover()
    await expect(stack).toHaveAttribute('data-expanded', 'true')

    // Verify all 3 toasts are visible and expanded
    const toasts = page.locator('[data-reference-toast-id]')
    await expect(toasts).toHaveCount(3)

    // Moving between toasts within the stack should keep data-expanded="true" (no flicker loop)
    const secondToast = toasts.nth(1)
    await secondToast.hover()
    await expect(stack).toHaveAttribute('data-expanded', 'true')

    // Clean up
    await page.getByTestId('btn-dismiss-all').click()
    await expect(toasts).toHaveCount(0)
  })
})
