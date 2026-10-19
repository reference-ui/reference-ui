/**
 * Browser proof isolates same-name regions across provider boundaries and cleanup.
 * Editable DOM state distinguishes live content updates from accidental remounts.
 */
import { test, expect } from '../../../../../playwright/ct'

test('SL-LIFECYCLE-01: removing and restoring a filler clears its host without leaking registrations', async ({ mount, page }) => {
  await mount('components/Slot/Slot.contracts/RegistryIsolationFixture')
  const outer = page.getByTestId('slot-host-outer')
  const inner = page.getByTestId('slot-host-inner')
  const sibling = page.getByTestId('slot-host-sibling')
  await page.getByRole('button', { name: 'Update outer title' }).click()

  for (let cycle = 0; cycle < 2; cycle++) {
    await page.getByRole('button', { name: 'Toggle outer filler' }).click()
    await expect(outer.getByTestId('registration-count')).toHaveText('0')
    await expect(outer.getByTestId('registered-title')).toHaveCount(0)
    await expect(outer.getByRole('textbox')).toHaveCount(0)
    await expect(inner.getByTestId('registered-title')).toHaveText('Inner')
    await expect(sibling.getByTestId('registered-title')).toHaveText('Sibling')

    await page.getByRole('button', { name: 'Toggle outer filler' }).click()
    await expect(outer.getByTestId('registration-count')).toHaveText('1')
    await expect(outer.getByTestId('registered-title')).toHaveText('Updated outer')
    await expect(outer.getByRole('textbox')).toHaveCount(1)
    await expect(outer.getByRole('textbox')).toHaveValue('Updated outer')
  }
})
