/**
 * Browser proof isolates same-name regions across provider boundaries and cleanup.
 * Editable DOM state distinguishes live content updates from accidental remounts.
 */
import { test, expect } from '../../../../../playwright/ct'

test('SL-INSTANCE-01: same-name regions stay isolated across sibling and nested provider updates', async ({ mount, page }) => {
  await mount('components/Slot/Slot.contracts/RegistryIsolationFixture')
  const outer = page.getByTestId('slot-host-outer')
  const inner = page.getByTestId('slot-host-inner')
  const sibling = page.getByTestId('slot-host-sibling')
  await expect(outer.getByTestId('registered-title')).toHaveText('Outer')
  await expect(inner.getByTestId('registered-title')).toHaveText('Inner')
  await expect(sibling.getByTestId('registered-title')).toHaveText('Sibling')
  await outer.getByLabel('Editable title').fill('Unsaved outer edit')
  await inner.getByLabel('Editable title').fill('Unsaved inner edit')

  await page.getByRole('button', { name: 'Update outer title' }).click()
  await expect(outer.getByTestId('registered-title')).toHaveText('Updated outer')
  await expect(outer.getByLabel('Editable title')).toHaveValue('Unsaved outer edit')
  await expect(inner.getByLabel('Editable title')).toHaveValue('Unsaved inner edit')
  await expect(sibling.getByLabel('Editable title')).toHaveValue('Sibling')

  await page.getByRole('button', { name: 'Toggle nested provider' }).click()
  await expect(inner).toHaveCount(0)
  await expect(outer.getByTestId('registration-count')).toHaveText('1')
  await expect(sibling.getByTestId('registration-count')).toHaveText('1')
  await page.getByRole('button', { name: 'Toggle nested provider' }).click()
  await expect(inner.getByLabel('Editable title')).toHaveValue('Inner')
  await expect(inner.getByTestId('registration-count')).toHaveText('1')
  await expect(outer.getByLabel('Editable title')).toHaveValue('Unsaved outer edit')
})
