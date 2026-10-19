/**
 * Tooltip composition gates and browser proofs. Slotted Triggers gain
 * aria-describedby and show Content on focus and hover, the tip anchors
 * to its trigger, warm-group neighbors open instantly inside the skip
 * window and cold after it, and Escape dismisses once without closing a
 * parent Overlay.
 */
import { test, expect, snap, pressTab } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator } from '@playwright/test'

test.describe('Tooltip Composition Gates & Browser Proofs', () => {
  test('TT-A11Y-01 scan: axe reports zero violations on the open tooltip', async ({
    mount,
    page,
  }) => {
    // Scanner half of TT-A11Y-01 (assertion half is TT-DOM-01/02's
    // role/describedby/content checks): Basic exercises a generated
    // descriptor ID plus keyboard-opened Content in one mount.
    // Whole-page scope: Content portals to document.body, so
    // #root-scoping would miss component-owned content; the gallery
    // holds one story per mount.
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()
    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')
    await pressTab(page)
    await expect(btnA).toBeFocused()
    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expectNoAxeViolations(page)
  })
});
