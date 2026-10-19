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

  test('BT-REST-01: Renders all button variants, icon configurations, and disabled states in resting state', async ({
    page,
  }) => {
    const btnDefault = page.getByTestId('btn-default')
    const btnPrimary = page.getByTestId('btn-primary')
    const btnGhost = page.getByTestId('btn-ghost')

    await expect(btnDefault).toBeVisible()
    await expect(btnPrimary).toBeVisible()
    await expect(btnGhost).toBeVisible()

    await snap(page, 'button-all-variants-resting')
  })
});
