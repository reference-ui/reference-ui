/**
 * Button browser proofs: resting variants and icon configurations plus
 * hover, active, focus, click, and disabled states with visual snaps.
 * Mounts the states fixtures; form-ownership contracts live in the
 * sibling contracts spec.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Button Component', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Button/Button/ButtonStatesFixture')
    await expect(page.getByTestId('button-fixture-root')).toBeVisible()
  })

  test('BT-DIS-01: Disabled buttons do not fire clicks and show disabled styles', async ({
    page,
  }) => {
    const btnDisabledDefault = page.getByTestId('btn-default-disabled')
    const btnDisabledPrimary = page.getByTestId('btn-primary-disabled')
    const btnDisabledGhost = page.getByTestId('btn-ghost-disabled')
    const counter = page.getByTestId('click-counter')

    await expect(btnDisabledDefault).toBeDisabled()
    await expect(btnDisabledPrimary).toBeDisabled()
    await expect(btnDisabledGhost).toBeDisabled()

    // Attempt to click disabled button (force click)
    await btnDisabledDefault.click({ force: true })
    await expect(counter).toHaveText('0')

    await snap(page, 'button-disabled-states')
  })
});
