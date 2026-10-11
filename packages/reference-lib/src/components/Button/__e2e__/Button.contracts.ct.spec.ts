/**
 * Button keeps native form ownership, submitter values, validation and keyboard activation.
 * These browser contracts exercise consumer cancellation without adding visual baselines.
 */
import { test, expect } from '../../../../playwright/ct'

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

test('BT-FORM-02: externally associated submit and reset buttons act on their owner form', async ({ mount, page }) => {
  await mount('components/Button/Button.contracts/ExternalFormFixture')
  const note = page.getByLabel('Note', { exact: true })
  await note.fill('Edited')
  await page.getByRole('button', { name: 'Publish note' }).click()
  await expect(page.getByTestId('button-external-submission')).toHaveText('[["note","Edited"],["command","publish"]]')
  await page.getByRole('button', { name: 'Reset note' }).click()
  await expect(note).toHaveValue('Original')
  await expect(page.getByTestId('button-external-submission')).toHaveText('[["note","Edited"],["command","publish"]]')
})

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
