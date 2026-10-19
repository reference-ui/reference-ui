/**
 * Button browser proofs: resting variants and icon configurations plus
 * hover, active, focus, click, and disabled states with visual snaps.
 * Mounts the states fixtures; form-ownership contracts live in the
 * sibling contracts spec.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test('BT-ICON-01: icons follow the button text colour unless a colour is passed', async ({
  mount,
  page,
}) => {
  await mount('components/Button/Button/ButtonIconColorFixture')
  await expect(page.getByTestId('button-icon-color-root')).toBeVisible()

  // Consumers load the icons stylesheet in an earlier cascade layer than lib, so the
  // icon's own `color: inherit` utility loses to lib globals. Dropping that class here
  // reproduces that cascade: the icon must still inherit because lib pins no colour on it.
  const colours = (testId: string) =>
    page.getByTestId(testId).evaluate(button => {
      const shell = button.querySelector<HTMLElement>('[data-slot="icon"]')!
      for (const cls of [...shell.classList]) if (cls.endsWith('__c_inherit')) shell.classList.remove(cls)
      return {
        button: getComputedStyle(button).color,
        svg: getComputedStyle(shell.querySelector('svg')!).color,
      }
    })

  for (const id of ['icon-color-default', 'icon-color-primary', 'icon-color-ghost', 'icon-color-native']) {
    const { button, svg } = await colours(id)
    expect(svg, id).toBe(button)
  }

  const explicit = await page.getByTestId('icon-color-explicit').evaluate(button => ({
    button: getComputedStyle(button).color,
    svg: getComputedStyle(button.querySelector('[data-slot="icon"] svg')!).color,
  }))
  expect(explicit.svg).not.toBe(explicit.button)
})
