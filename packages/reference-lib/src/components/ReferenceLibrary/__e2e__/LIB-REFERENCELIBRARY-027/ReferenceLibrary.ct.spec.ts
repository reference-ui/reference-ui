/**
 * ReferenceLibrary composition gates and browser proofs. Renders the
 * application transparently, elects the earliest live mount as active
 * host, serves imperative toasts with live-region updates, fails over to
 * standby on unmount, and follows the mounting root's color mode.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('ReferenceLibrary Color Mode Placement & Browser Proofs', () => {
  test('RL-DOM-05: runtime hosts follow the color mode of the root they are mounted in', async ({
    mount,
    page,
  }) => {
    await mount('components/ReferenceLibrary/ReferenceLibrary/ColorModeRoot')
    const toggle = page.getByTestId('rl-color-toggle')
    await expect(toggle).toBeVisible()

    const readHostMode = () =>
      page.evaluate(
        () =>
          document
            .querySelector('[data-reference-toast-host]')
            ?.closest('[data-color-mode]')
            ?.getAttribute('data-color-mode') ?? null,
      )

    await expect.poll(readHostMode).toBe('dark')
    await toggle.click()
    await expect.poll(readHostMode).toBe('light')
    await toggle.click()
    await expect.poll(readHostMode).toBe('dark')
  })
});
