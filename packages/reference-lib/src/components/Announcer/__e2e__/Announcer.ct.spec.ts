import { test, expect } from '../../../../playwright/ct'

// No snap(): the host is visually hidden by contract; behavior asserts only.
test('announcer story announces polite and assertive into independent live regions', async ({
  mount,
  page,
}) => {
  await mount('components/Announcer/Announcer/AnnouncerFixture')
  await expect(page.getByTestId('announcer-fixture-root')).toBeVisible()

  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  await page.getByTestId('btn-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Polite message #1')
  await expect(page.getByTestId('readout-polite')).toHaveText('Polite message #1')

  await page.getByTestId('btn-announce-assertive').click()
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText(
    'Assertive message #1'
  )
  await expect(page.getByTestId('readout-assertive')).toHaveText('Assertive message #1')

  // Independent channels: assertive traffic leaves polite untouched.
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Polite message #1')

  // Every insertion was an observable DOM mutation.
  const mutations = await page.getByTestId('readout-mutations').textContent()
  expect(Number(mutations)).toBeGreaterThan(0)
})
