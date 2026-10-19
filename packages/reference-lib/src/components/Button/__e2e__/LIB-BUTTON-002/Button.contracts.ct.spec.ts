/**
 * Button keeps native form ownership, submitter values, validation and keyboard activation.
 * These browser contracts exercise consumer cancellation without adding visual baselines.
 */
import { test, expect } from '../../../../../playwright/ct'

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
