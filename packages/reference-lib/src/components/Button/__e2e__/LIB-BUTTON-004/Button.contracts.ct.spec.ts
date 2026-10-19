/**
 * Button keeps native form ownership, submitter values, validation and keyboard activation.
 * These browser contracts exercise consumer cancellation without adding visual baselines.
 */
import { test, expect } from '../../../../../playwright/ct'

test('BT-KEY-01: native Enter and Space activate once while disabled fieldset buttons are skipped', async ({ mount, page }) => {
  await mount('components/Button/Button.contracts/NativeKeyboardFixture')
  const shortcut = page.getByRole('button', { name: 'Activate shortcut' })
  const events = page.getByTestId('button-keyboard-events')
  await shortcut.focus()
  await page.keyboard.press('Enter')
  await expect(events).toHaveText('["click:0"]')
  await page.keyboard.down('Space')
  await expect(events).toHaveText('["click:0"]')
  await page.keyboard.up('Space')
  await expect(events).toHaveText('["click:0","click:0"]')

  const disabled = page.getByRole('button', { name: 'Disabled by group' })
  await expect(disabled).toBeDisabled()
  await disabled.click({ force: true })
  await expect(events).toHaveText('["click:0","click:0"]')
  await shortcut.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'After disabled group' })).toBeFocused()
})
