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

  test('RF-ISOLATE-01: sibling roots with repeated item identities keep focus stops and typeahead buffers independent', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/SiblingLifetimeFixture')
    await page.getByTestId('lifetime-first-Alpha').focus()
    await page.keyboard.press('b')
    await expect(page.getByTestId('lifetime-first-Beta')).toBeFocused()
    await expect(page.getByTestId('lifetime-second-Alpha')).toHaveAttribute('tabindex', '0')

    await page.getByTestId('lifetime-second-Alpha').focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('lifetime-second-Romeo')).toBeFocused()
    await expect(page.getByTestId('lifetime-first-Beta')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('lifetime-second-Bread')).toHaveAttribute('tabindex', '-1')

    await page.getByTestId('lifetime-first-Beta').focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('lifetime-first-Bread')).toBeFocused()
    await expect(page.getByTestId('lifetime-second-Romeo')).toHaveAttribute('tabindex', '0')
    for (const group of ['first', 'second']) {
      await expect(page.getByTestId(`lifetime-${group}`).locator('[tabindex="0"]')).toHaveCount(1)
    }
    await expect(page.getByTestId('lifetime-activations')).toHaveText('0')
  })
});
