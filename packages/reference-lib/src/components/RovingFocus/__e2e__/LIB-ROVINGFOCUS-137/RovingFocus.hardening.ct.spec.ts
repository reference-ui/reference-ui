/**
 * RovingFocus instance-lifetime hardening. Sibling roots with repeated
 * item identities keep focus stops and typeahead buffers independent,
 * and remounting one root resets only its own search and current item.
 */
import { test, expect } from '../../../../../playwright/ct'

test.describe('RovingFocus instance lifetime', () => {
  test.beforeEach(async ({ page }) => {
    // Buffer ownership must remain observable even when a loaded runner takes
    // longer than the model's one-second idle timeout between browser actions.
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  })

  test('RF-LIFETIME-01: remount resets one root search and current item while the surviving sibling retains both', async ({ mount, page }) => {
    const fixture = await mount('components/RovingFocus/RovingFocus/SiblingLifetimeFixture')
    const firstAlpha = page.getByTestId('lifetime-first-Alpha')
    const originalFirst = await firstAlpha.elementHandle()
    const secondBeta = page.getByTestId('lifetime-second-Beta')
    const originalSecond = await secondBeta.elementHandle()

    await firstAlpha.focus()
    await page.keyboard.press('b')
    await expect(page.getByTestId('lifetime-first-Beta')).toBeFocused()
    await page.getByTestId('lifetime-second-Alpha').focus()
    await page.keyboard.press('b')
    await expect(secondBeta).toBeFocused()

    await fixture.update({ generation: 1 })
    expect(await firstAlpha.evaluate((element, node) => element === node, originalFirst)).toBe(false)
    expect(await secondBeta.evaluate((element, node) => element === node, originalSecond)).toBe(true)
    await expect(firstAlpha).toHaveAttribute('tabindex', '0')
    await expect(secondBeta).toHaveAttribute('tabindex', '0')
    await expect(secondBeta).toBeFocused()

    await firstAlpha.focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('lifetime-first-Romeo')).toBeFocused()
    await secondBeta.focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('lifetime-second-Bread')).toBeFocused()
    await expect(page.getByTestId('lifetime-first-Romeo')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('lifetime-activations')).toHaveText('0')
  })
});
