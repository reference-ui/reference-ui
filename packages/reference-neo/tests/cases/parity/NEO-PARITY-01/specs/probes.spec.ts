// probes.spec.ts — spec for NEO-PARITY-01, the live W4 probe roster. Takes
// { page } from the runner with the world freshly synced and the page already
// navigated to it. Emits nothing on success; throws naming the first probe
// whose paint, flip, or viewport branch fails on failure. P9 runs last: it
// moves the viewport and nothing after it may depend on the default size.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function paint(page: SpecPage, selector: string): Promise<{ color: string; background: string }> {
  const node = page.locator(selector);
  await node.waitFor();
  const color = await node.evaluate((el) => getComputedStyle(el).color);
  const background = await node.evaluate((el) => getComputedStyle(el).backgroundColor);
  return { color, background };
}

async function computed(page: SpecPage, selector: string, read: (el: HTMLElement) => string): Promise<string> {
  const node = page.locator(selector);
  await node.waitFor();
  return node.evaluate(read);
}

// P1: the dark island renders as a body child, stamps data-color-mode,
// paints dark ink while the page is light, and no data-panda-theme
// attribute exists anywhere in the document.
async function checkPortalIsland(page: SpecPage): Promise<void> {
  const portal = page.locator('#parity-portal');
  await portal.waitFor();
  assert.equal(await portal.evaluate((el) => el.parentElement?.tagName), 'BODY');
  const island = page.locator('#p1');
  await island.waitFor();
  assert.equal(await island.evaluate((el) => el.getAttribute('data-color-mode')), 'dark');
  assert.equal((await paint(page, '#p1')).color, 'rgb(245, 245, 245)');
  assert.equal(
    await page.locator('html').evaluate((el) => el.ownerDocument.querySelectorAll('[data-panda-theme]').length),
    0,
  );
}

// P2: the second sibling carries the adjacent margin; the leader is flush.
async function checkSiblings(page: SpecPage): Promise<void> {
  assert.equal(await computed(page, '#p2-first', (el) => getComputedStyle(el).marginLeft), '0px');
  assert.equal(await computed(page, '#p2-second', (el) => getComputedStyle(el).marginLeft), '8px');
}

// P6: the inline style consumes the :root var the globalCss rule emitted.
async function checkStyleVar(page: SpecPage): Promise<void> {
  assert.equal(await computed(page, '#p6', (el) => getComputedStyle(el).width), '24px');
}

// P10: the named region exposes its authored container name and type.
async function checkNamedRegion(page: SpecPage): Promise<void> {
  assert.equal(
    await computed(page, '#region', (el) => getComputedStyle(el).getPropertyValue('container-name')),
    'sidebar',
  );
  assert.equal(
    await computed(page, '#region', (el) => getComputedStyle(el).getPropertyValue('container-type')),
    'inline-size',
  );
}

// P11: neither half of the composition paints alone — the open twin
// unhovered and the closed twin both stay ink. The positive hover arm is
// sheet-proven (sheet.spec.ts); SpecPage offers no hover.
async function checkAttrHover(page: SpecPage): Promise<void> {
  assert.equal((await paint(page, '#p11-open')).color, 'rgb(17, 17, 17)');
  assert.equal((await paint(page, '#p11-closed')).color, 'rgb(17, 17, 17)');
  const open = page.locator('#p11-open');
  await open.waitFor();
  assert.equal(await open.evaluate((el) => el.matches('[data-state="open"]:hover')), false);
}

// P12: display, overflow, and letter-spacing breadth each paint.
async function checkBreadth(page: SpecPage): Promise<void> {
  assert.equal(await computed(page, '#p12', (el) => getComputedStyle(el).display), 'flex');
  assert.equal(await computed(page, '#p12', (el) => getComputedStyle(el).overflow), 'hidden');
  assert.equal(await computed(page, '#p12', (el) => getComputedStyle(el).letterSpacing), '-0.16px');
}

// P13: the first-child recipe arm paints the 8px base under the narrow
// root and the 16px md arm under the wide region; the plain sibling
// paints 4px base and 12px under md. F32 rides the same region.
async function checkFirstChild(page: SpecPage): Promise<void> {
  assert.equal(await computed(page, '#p13-first', (el) => getComputedStyle(el).paddingTop), '16px');
  assert.equal(await computed(page, '#p13-second', (el) => getComputedStyle(el).paddingTop), '12px');
  assert.equal(await computed(page, '#p13-narrow-first', (el) => getComputedStyle(el).paddingTop), '8px');
  assert.equal(await computed(page, '#f32', (el) => getComputedStyle(el).width), '60px');
}

// P17: the semantic slash mix paints light, then repaints dark with the
// island flip; the _dark override rides the same flip.
async function checkDarkMix(page: SpecPage): Promise<void> {
  assert.equal((await paint(page, '#p17')).background, 'color(srgb 0.486275 0.227451 0.929412 / 0.4)');
  assert.equal((await paint(page, '#dark-override')).color, 'rgb(17, 17, 17)');
  const html = page.locator('html');
  await html.waitFor();
  await html.evaluate((el) => el.setAttribute('data-color-mode', 'dark'));
  assert.equal((await paint(page, '#p17')).background, 'color(srgb 0.654902 0.545098 0.980392 / 0.4)');
  assert.equal((await paint(page, '#dark-override')).color, 'rgb(74, 222, 128)');
  await html.evaluate((el) => el.setAttribute('data-color-mode', 'light'));
}

// P18 plus F1: the vendor property passes through hyphenated and reads
// back; the invalid slash passes through to the sheet while the browser
// drops the invalid declaration, staying transparent.
async function checkPassthroughs(page: SpecPage): Promise<void> {
  assert.equal(
    await computed(page, '#p18', (el) => getComputedStyle(el).getPropertyValue('-webkit-box-orient')),
    'vertical',
  );
  assert.equal((await paint(page, '#f1')).background, 'rgba(0, 0, 0, 0)');
}

// Census helpers: negatives, rhythm calc, important, radii, animation,
// and the font macros all paint their token values.
async function checkCensusHelpers(page: SpecPage): Promise<void> {
  assert.equal(await computed(page, '#probe-negative', (el) => getComputedStyle(el).marginTop), '-8px');
  assert.equal(await computed(page, '#probe-calc', (el) => getComputedStyle(el).fontSize), '14px');
  assert.equal((await paint(page, '#probe-bang')).color, 'rgb(124, 58, 237)');
  assert.equal(
    await computed(page, '#probe-radius-token', (el) => getComputedStyle(el).borderTopLeftRadius),
    '12px',
  );
  assert.equal(
    await computed(page, '#probe-radius-rhythm', (el) => getComputedStyle(el).borderTopLeftRadius),
    '4px',
  );
  assert.equal(await computed(page, '#probe-anim', (el) => getComputedStyle(el).animationName), 'fadeIn');
  assert.ok(
    (await computed(page, '#probe-font', (el) => getComputedStyle(el).fontFamily)).includes('Inter'),
    'font macro resolves the family stack',
  );
  assert.equal(await computed(page, '#probe-font', (el) => getComputedStyle(el).fontWeight), '700');
}

// P9 last: the height-threshold recipe branch flips with the viewport.
async function checkHeightBranch(page: SpecPage): Promise<void> {
  const height = page.locator('#p9');
  await height.waitFor();
  await page.setViewportSize({ width: 900, height: 580 });
  assert.equal(await height.evaluate((el) => getComputedStyle(el).paddingTop), '0px');
  assert.equal(await height.evaluate((el) => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
  await page.setViewportSize({ width: 900, height: 820 });
  assert.equal(await height.evaluate((el) => getComputedStyle(el).paddingTop), '16px');
  assert.equal(await height.evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(22, 163, 74)');
}

export default async function run({ page }: SpecInput): Promise<void> {
  // P4 cites RS-25 (radius pair shorthands emit non-properties, so the
  // world authors none; sheet.spec.ts guards the avoidance). Singles still
  // paint: the token and rhythm radii in checkCensusHelpers.
  await checkPortalIsland(page);
  await checkSiblings(page);
  await checkStyleVar(page);
  await checkNamedRegion(page);
  await checkAttrHover(page);
  await checkBreadth(page);
  await checkFirstChild(page);
  await checkDarkMix(page);
  await checkPassthroughs(page);
  await checkCensusHelpers(page);
  await checkHeightBranch(page);
}
