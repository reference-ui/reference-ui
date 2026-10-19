/**
 * Uncontrolled switch lifecycle contracts run against browser activation under StrictMode.
 * They cover default initialization, instance isolation, remounts and cancellation ordering.
 */
import { test, expect } from '../../../../../playwright/ct'

test('SW-LIFECYCLE-01: uncontrolled instances retain their own state across default changes and reset on remount', async ({ mount, page }) => {
  await mount('components/Switch/Switch.contracts/UncontrolledLifecycleFixture')
  const first = page.getByRole('switch', { name: 'First preference' })
  const second = page.getByRole('switch', { name: 'Second preference' })
  await expect(first).toHaveAttribute('aria-checked', 'false')
  await expect(second).toHaveAttribute('aria-checked', 'true')

  await first.click()
  await expect(first).toHaveAttribute('aria-checked', 'true')
  await expect(second).toHaveAttribute('aria-checked', 'true')
  await first.press('Space')
  await expect(first).toHaveAttribute('aria-checked', 'false')
  await second.click()
  await expect(second).toHaveAttribute('aria-checked', 'false')

  await page.getByRole('button', { name: 'Change first default' }).click()
  await expect(first).toHaveAttribute('aria-checked', 'false')
  await expect(first.locator('[data-reference-switch-thumb]')).toHaveAttribute('data-state', 'unchecked')
  await page.getByRole('button', { name: 'Toggle first mount' }).click()
  await expect(first).toHaveCount(0)
  await expect(second).toHaveAttribute('aria-checked', 'false')
  await page.getByRole('button', { name: 'Toggle first mount' }).click()
  await expect(first).toHaveAttribute('aria-checked', 'true')
  await expect(first.locator('[data-reference-switch-thumb]')).toHaveCount(1)
  await expect(second).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('switch-lifecycle-events')).toHaveText('["click:false","change:true","click:true","change:false"]')
})

test('SW-EVENT-01: canceled uncontrolled activation leaves no hidden state and consumer clicks precede change requests', async ({ mount, page }) => {
  const fixture = await mount('components/Switch/Switch.contracts/UncontrolledLifecycleFixture', { cancel: true })
  const first = page.getByRole('switch', { name: 'First preference' })
  await first.click()
  await first.press('Enter')
  await expect(first).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('switch-lifecycle-events')).toHaveText('["click:false","click:false"]')

  await fixture.update({ cancel: false })
  await first.press('Space')
  await expect(first).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('switch-lifecycle-events')).toHaveText('["click:false","click:false","click:false","change:true"]')
})
