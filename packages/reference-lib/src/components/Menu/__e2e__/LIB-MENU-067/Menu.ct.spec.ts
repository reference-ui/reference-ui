/**
 * Menu browser proofs: composition gates plus the root-level parity
 * re-targets across DOM, focus, typeahead, and action rows. Mounts the
 * story fixtures and asserts levels, roving, and one-selection
 * discipline in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

async function centerOf(locator: {
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>
}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('expected a bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('Menu LinkItem (FEATURES #3)', () => {

  test('MN-LINK-02: Primary click navigates natively and dismisses by default', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    const trigger = page.getByTestId('btn-link-trigger')
    await trigger.click()

    await page.getByTestId('menu-link-help').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Help')
    await expect(page.getByTestId('menu-link-select-event')).toHaveText(
      'Link Select Event: click:1:false'
    )
    expect(await page.evaluate(() => window.location.hash)).toBe('#help-section')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText('Link Open Logs: true,false')
    // Firefox resets focus to body on fragment
    // navigation, after the product's trigger restore — Chromium keeps the
    // restored trigger. Dismiss + navigation assertions above hold on both.
    if (engineOf() === 'firefox') {
      await expect(page.locator('body')).toBeFocused()
    } else {
      await expect(trigger).toBeFocused()
    }
  })
})
