/**
 * Field leaves native validation, successful-control serialization and reset behavior with its children.
 * Status rerenders preserve focused editing state instead of replacing controls.
 */
import { test, expect } from '../../../../../playwright/ct'

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
