// interactive.spec.ts — spec for NEO-PGEN-06, the html-interactive case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws
// naming the tag whose probe is missing, misnamed, unmarked, or leaking,
// or the native toggle, hover arm, or dark arm that never painted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose click and hover
// members the narrow SpecPage shape omits; this interface names just them.
interface InteractPage {
  click(selector: string): Promise<void>;
  hover(selector: string): Promise<void>;
}

// Probe id plus dom tag for every interactive probe: 5 family members
// with the second form, island, and light control pinned individually.
// The island child is asserted with the dark leg: nested under an
// explicit colorMode it inherits the layer scope (no data-layer of its
// own) while resolving the island's dark mode onto itself.
const EXPECTED_PROBES: Array<readonly [string, string]> = [
  ['int-area', 'area'],
  ['int-details', 'details'],
  ['int-summary', 'summary'],
  ['int-dialog', 'dialog'],
  ['int-live', 'form'],
  ['int-twin', 'form'],
  ['int-island', 'details'],
  ['int-brand-light', 'summary'],
];

// One hover wrap, one dark armed rule, four utilities: two rests plus
// one arm each.
function assertSheet(worldDir: string): void {
  const styles = fs.readFileSync(
    path.join(worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const wraps = styles.split(':is(:hover, [data-hover])').length - 1;
  assert.equal(wraps, 1, `sheet carries one hover :is() selector, got ${wraps}`);
  assert.ok(
    styles.includes('[data-color-mode=dark] .neo-pgen6__dark\\:c_paper'),
    'sheet carries the dark armed rule',
  );
  const utilityCount = styles.match(/\.neo-pgen6__/g)?.length ?? 0;
  assert.equal(utilityCount, 4, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
}

// One locator read per pinned probe: element name, marker, layer stamp,
// and styling-key absence.
async function assertIdentity(page: SpecPage): Promise<void> {
  // One visibility wait establishes the render; the per-probe reads use
  // evaluate alone because the area never becomes visible yet still
  // resolves, stamps, and reports its native attrs.
  const root = page.locator('#int-root');
  await root.waitFor();
  const first = page.locator('#int-summary');
  await first.waitFor();
  for (const [id, tag] of EXPECTED_PROBES) {
    const probe = page.locator(`#${id}`);
    assert.equal(
      (await probe.evaluate((el) => el.tagName)).toLowerCase(),
      tag,
      `probe ${id} renders its own element`,
    );
    const className = await probe.evaluate((el) => el.getAttribute('class'));
    assert.ok(className?.includes(`ref-${tag}`), `marker class names the ${tag} tag, got ${className}`);
    assert.equal(
      await probe.evaluate((el) => el.getAttribute('data-layer')),
      'neo-pgen6',
      `probe ${id} stamps the system layer`,
    );
    assert.equal(
      await probe.evaluate((el) => el.getAttribute('color')),
      null,
      `color stays off the ${id} element`,
    );
    assert.equal(
      await probe.evaluate((el) => el.hasAttribute('_hover')),
      false,
      `_hover stays off the ${id} element`,
    );
  }
}

// The details toggles open and shut under clicks, the dialog stays
// closed, and area and form attrs land.
async function assertNative(page: SpecPage): Promise<void> {
  const interact = page as unknown as InteractPage;
  const details = page.locator('#int-details');
  assert.equal(
    await details.evaluate((el) => (el as HTMLDetailsElement).open),
    false,
    'details starts closed',
  );
  await interact.click('#int-summary');
  assert.equal(
    await details.evaluate((el) => (el as HTMLDetailsElement).open),
    true,
    'clicking the summary opens the details natively',
  );
  await interact.click('#int-summary');
  assert.equal(
    await details.evaluate((el) => (el as HTMLDetailsElement).open),
    false,
    'clicking the summary again closes the details natively',
  );

  const dialog = page.locator('#int-dialog');
  assert.equal(
    await dialog.evaluate((el) => (el as HTMLDialogElement).open),
    false,
    'dialog renders closed by default',
  );

  const area = page.locator('#int-area');
  assert.equal(
    await area.evaluate((el) => el.getAttribute('shape')),
    'rect',
    'area shape lands',
  );
  assert.equal(
    await area.evaluate((el) => el.getAttribute('coords')),
    '0,0,10,10',
    'area coords land',
  );
  assert.equal(
    await area.evaluate((el) => el.childNodes.length),
    0,
    'the void area renders childless',
  );
  const live = page.locator('#int-live');
  assert.equal(
    await live.evaluate((el) => el.getAttribute('action')),
    '/live',
    'form action lands',
  );
}

// The live form rests on ink, paints under a real hover, and releases;
// its twin paints via data-hover without interaction.
async function assertHover(page: SpecPage): Promise<void> {
  const interact = page as unknown as InteractPage;
  const live = page.locator('#int-live');
  assert.equal(
    await live.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    'live form rests on its ink base',
  );
  assert.equal(
    await live.evaluate((el) => el.hasAttribute('data-hover')),
    false,
    'live carries no data-hover, so only :hover can paint it',
  );
  const twin = page.locator('#int-twin');
  await twin.waitFor();
  assert.equal(
    await twin.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'twin paints via data-hover',
  );
  await interact.hover('#int-live');
  assert.equal(
    await live.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'real hover paints the live form',
  );
  await interact.hover('#int-twin');
  assert.equal(
    await live.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    'leaving restores the live base color',
  );
}

// The island stamps dark, its child inherits the scope while resolving
// dark and repainting paper, and the light control keeps brand.
async function assertDark(page: SpecPage): Promise<void> {
  const island = page.locator('#int-island');
  assert.equal(
    await island.evaluate((el) => el.getAttribute('data-color-mode')),
    'dark',
    'island stamps data-color-mode="dark"',
  );
  const dark = page.locator('#int-brand-dark');
  await dark.waitFor();
  assert.equal(
    (await dark.evaluate((el) => el.tagName)).toLowerCase(),
    'summary',
    'island child renders its own element',
  );
  assert.ok(
    (await dark.evaluate((el) => el.getAttribute('class')))?.includes('ref-summary'),
    'island child carries its marker',
  );
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('data-layer')),
    null,
    'island child inherits the layer scope instead of restamping',
  );
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('data-color-mode')),
    'dark',
    'island child resolves the inherited dark mode',
  );
  assert.equal(
    await dark.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 255, 255)',
    'island summary repaints paper',
  );
  const light = page.locator('#int-brand-light');
  await light.waitFor();
  assert.equal(
    await light.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'light control keeps brand',
  );
}

// Identity, markers, and silence first; native behavior, hover arm,
// and dark arm after.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheet(c.worldDir);
  await assertIdentity(page);
  await assertNative(page);
  await assertHover(page);
  await assertDark(page);
}
