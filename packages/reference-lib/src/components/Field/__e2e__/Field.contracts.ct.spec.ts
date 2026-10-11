/**
 * Field leaves native validation, successful-control serialization and reset behavior with its children.
 * Status rerenders preserve focused editing state instead of replacing controls.
 */
import { test, expect } from '../../../../playwright/ct'

test('FI-FORM-01: enclosed native controls preserve validation, serialization and reset semantics', async ({ mount, page }) => {
  await mount('components/Field/Field.contracts/NativeControlsFixture', { warning: true })
  const email = page.getByLabel('Account email')
  const note = page.getByLabel('Account note')
  const region = page.getByLabel('Region', { exact: true })
  const submission = page.getByTestId('field-native-submission')

  await page.getByText('Account email', { exact: true }).click()
  await expect(email).toBeFocused()
  await page.getByRole('button', { name: 'Save account' }).click()
  await expect(submission).toHaveText('none')
  await expect(email).toBeFocused()
  expect(await email.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true)

  await email.fill('person@example.com')
  await note.fill('Edited note')
  await region.selectOption('fr')
  await page.getByRole('button', { name: 'Save account' }).click()
  await expect(submission).toHaveText('[["email","person@example.com"],["note","Edited note"],["region","fr"],["account","account-7"]]')
  await expect(page.getByTestId('field-native-bezel')).not.toHaveAttribute('aria-invalid')
  await expect(email).not.toHaveAttribute('aria-invalid')

  await page.getByRole('button', { name: 'Reset account' }).click()
  await expect(email).toHaveValue('')
  await expect(note).toHaveValue('Initial note')
  await expect(region).toHaveValue('uk')
  await expect(page.getByLabel('Account identifier')).toHaveValue('account-7')
})

test('FI-LIFECYCLE-01: status rerenders preserve native dirty text, focus and selection without affecting sibling controls', async ({ mount, page }) => {
  const fixture = await mount('components/Field/Field.contracts/NativeControlsFixture')
  const note = page.getByLabel('Account note')
  await note.fill('Unsaved draft')
  await note.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(2, 7))
  await fixture.update({ warning: true })
  await expect(note).toBeFocused()
  await expect(note).toHaveValue('Unsaved draft')
  expect(await note.evaluate((element: HTMLTextAreaElement) => [element.selectionStart, element.selectionEnd])).toEqual([2, 7])
  await expect(page.getByTestId('field-native-bezel')).toHaveAttribute('data-status', 'warning')
  await expect(page.getByLabel('Account email')).toHaveValue('')
  await expect(page.getByLabel('Region', { exact: true })).toHaveValue('uk')
})
