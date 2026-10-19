/**
 * Button keeps native form ownership, submitter values, validation and keyboard activation.
 * These browser contracts exercise consumer cancellation without adding visual baselines.
 */
import { test, expect } from '../../../../../playwright/ct'

test('BT-EVENT-01: consumer cancellation prevents native submit for click and keyboard activation', async ({ mount, page }) => {
  const fixture = await mount('components/Button/Button.contracts/NativeFormFixture', {
    cancelClick: true,
    cancelKeyboard: false,
  })
  const save = page.getByRole('button', { name: 'Save changes' })
  await page.getByLabel('Email').fill('person@example.com')
  await save.click()
  await save.press('Enter')
  await save.press('Space')
  await expect(page.getByTestId('button-contract-events')).toHaveText('["click","click","click"]')
  await expect(page.getByTestId('button-contract-submission')).toHaveText('none')

  await fixture.update({ cancelClick: false, cancelKeyboard: true })
  await save.press('Enter')
  await save.press('Space')
  await expect(page.getByTestId('button-contract-events')).toHaveText('["click","click","click","cancel:Enter","cancel: "]')
  await expect(page.getByTestId('button-contract-submission')).toHaveText('none')
})
