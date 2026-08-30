import { expect, test } from '@playwright/test'

test('library harness boots and renders the fixture root', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('lib-root')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reference UI lib' })).toBeVisible()
  await expect(page.getByText('Library fixture for foundation and ARIA primitives.')).toBeVisible()

  const reactVersion = (await page.getByTestId('react-version').textContent()) ?? ''
  console.log(`react version: ${reactVersion}`)
  await expect(page.getByTestId('react-version')).toHaveText(/^(17|18|19)\./)
})
