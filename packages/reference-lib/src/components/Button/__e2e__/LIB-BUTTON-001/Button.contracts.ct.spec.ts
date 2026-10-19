/**
 * Button keeps native form ownership, submitter values, validation and keyboard activation.
 * These browser contracts exercise consumer cancellation without adding visual baselines.
 */
import { test, expect } from '../../../../../playwright/ct'

test('BT-FORM-01: default submission respects native validity and includes the clicked submitter', async ({ mount, page }) => {
  await mount('components/Button/Button.contracts/NativeFormFixture')
  const save = page.getByRole('button', { name: 'Save changes' })
  const submission = page.getByTestId('button-contract-submission')
  const events = page.getByTestId('button-contract-events')

  expect(await save.evaluate((element: HTMLButtonElement) => element.type)).toBe('submit')
  await save.click()
  await expect(events).toHaveText('["click"]')
  await expect(submission).toHaveText('none')
  await expect(page.getByLabel('Email')).toBeFocused()

  await page.getByLabel('Email').fill('person@example.com')
  await page.getByRole('button', { name: 'Preview changes' }).click()
  await expect(submission).toHaveText('none')
  await save.click()
  await expect(events).toHaveText('["click","click","submit"]')
  await expect(submission).toHaveText(JSON.stringify({
    submitter: 'button-contract-save',
    entries: [['email', 'person@example.com'], ['command', 'save']],
  }))
})
