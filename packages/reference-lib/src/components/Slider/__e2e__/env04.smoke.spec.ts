import { test, expect } from '/Users/ryn/Developer/reference-ui/packages/reference-lib/playwright/ct'

test('SD-ENV-04 smoke: scalar keyboard plus range track-press and outside-drag', async ({
  mount,
  page,
}) => {
  // Scalar keyboard sequence: identical requests, focus, ARIA, percentages.
  const first = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
  const thumb = page.getByTestId('logged-thumb-0')
  await thumb.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('logged-changes')).toHaveText('[21,22]')
  await expect(page.getByTestId('logged-ends')).toHaveText('[21,22]')
  await expect(thumb).toBeFocused()
  await expect(thumb).toHaveAttribute('aria-valuenow', '22')
  const thumbStyle = await thumb.getAttribute('style')
  expect(thumbStyle).toContain('--reference-slider-thumb-position: 22%')
  await first.unmount()

  // Two-thumb track press: nearest thumb, focus, neighbor bounds.
  await mount('components/Slider/Slider/LoggedFixture', { initial: [20, 80], width: 300 })
  const track = page.getByTestId('logged-track')
  const thumb0 = page.getByTestId('logged-thumb-0')
  const thumb1 = page.getByTestId('logged-thumb-1')
  await page.evaluate(() => {
    ;(window as any).__cap = []
    const t = document.querySelector('[data-testid="logged-track"]')!
    t.addEventListener('gotpointercapture', () => (window as any).__cap.push('got'))
    t.addEventListener('lostpointercapture', () => (window as any).__cap.push('lost'))
  })
  const box = await track.boundingBox()
  expect(box).not.toBeNull()
  await track.click({ position: { x: 180, y: box!.height / 2 } })
  await expect(thumb1).toBeFocused()
  await expect(page.getByTestId('logged-changes')).toHaveText('[[20,60]]')
  await expect(thumb0).toHaveAttribute('aria-valuemax', '60')
  await expect(thumb1).toHaveAttribute('aria-valuemin', '20')

  // Outside drag from a track press: clamped, captured, released once.
  await page.mouse.move(box!.x + 240, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width + 100, box!.y + box!.height / 2)
  await page.mouse.up()
  await expect(page.getByTestId('logged-changes')).toHaveText('[[20,60],[20,80],[20,100]]')
  await expect(page.getByTestId('logged-ends')).toHaveText('[[20,60],[20,100]]')
  await expect(thumb1).toBeFocused()
  expect(await page.evaluate(() => (window as any).__cap)).toEqual(['got', 'lost', 'got', 'lost'])
  const rangeStyle = await page.getByTestId('logged-range').getAttribute('style')
  expect(rangeStyle).toContain('--reference-slider-range-start: 20%')
  expect(rangeStyle).toContain('--reference-slider-range-end: 100%')
})
