/**
 * Uncontrolled switch lifecycle contracts run against browser activation under StrictMode.
 * They cover default initialization, instance isolation, remounts and cancellation ordering.
 */
import { test, expect } from '../../../../../playwright/ct'

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
