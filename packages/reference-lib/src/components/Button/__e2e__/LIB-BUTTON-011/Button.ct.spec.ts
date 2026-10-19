/**
 * Button browser proofs: resting variants and icon configurations plus
 * hover, active, focus, click, and disabled states with visual snaps.
 * Mounts the states fixtures; form-ownership contracts live in the
 * sibling contracts spec.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test('bare primitive Button is inline shrink-to-fit, matching native button', async ({
  mount,
  page,
}) => {
  await mount('components/Button/Button/ButtonBlockDefault')

  const bare = page.getByTestId('btn-bare')
  const native = page.getByTestId('btn-native')
  const root = page.getByTestId('button-block-root')
  await expect(bare).toBeVisible()
  await expect(native).toBeVisible()

  const display = await bare.evaluate(el => getComputedStyle(el).display)
  expect(display).toBe('inline-flex')

  const bareBox = await bare.boundingBox()
  const nativeBox = await native.boundingBox()
  const rootBox = await root.boundingBox()
  expect(bareBox && nativeBox && rootBox).toBeTruthy()
  // Shrink-to-fit: nowhere near the 600px container width.
  expect(bareBox!.width).toBeLessThan(rootBox!.width / 2)
  // Inline with the native button on the same line (vertical overlap).
  expect(bareBox!.y).toBeLessThan(nativeBox!.y + nativeBox!.height)
  expect(nativeBox!.y).toBeLessThan(bareBox!.y + bareBox!.height)
})
