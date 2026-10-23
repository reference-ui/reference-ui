/**
 * NumberField browser proof that an echoed validate commit still reports.
 * Issue #25: when the parent has already echoed the live onChange, the
 * commit requests nothing yet calls onInvalidCommit with its reason.
 * Mounts ValidateFixture, whose advisory log renders every report, and
 * pins the retained value and managed aria-invalid after Enter and Tab.
 */
import { test, expect } from '../../../../../playwright/ct'

test.describe('NumberField CT', () => {
  test('NF-COMMIT-12: Validate commit reports onInvalidCommit when the parent has echoed the live value', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/ValidateFixture')

    const input = page.getByTestId('validate-input')
    const display = page.getByTestId('validate-display')
    const log = page.getByTestId('validate-log')

    await expect(input).toHaveValue('5')
    await expect(log).toHaveText('invalid: none')

    // Live onChange publishes 2.5 and the fixture echoes it before Enter.
    await input.fill('2.5')
    await expect(display).toHaveText('Validate Value: 2.5')
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('invalid: 2.5:off-step')
    await expect(input).toHaveValue('2.5')
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    // Tab is a commit boundary too; out-of-range reports range-first.
    await input.fill('25')
    await expect(display).toHaveText('Validate Value: 25')
    await page.keyboard.press('Tab')
    await expect(log).toHaveText('invalid: 2.5:off-step, 25:out-of-range')
    await expect(input).toHaveValue('25')
    await expect(display).toHaveText('Validate Value: 25')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
