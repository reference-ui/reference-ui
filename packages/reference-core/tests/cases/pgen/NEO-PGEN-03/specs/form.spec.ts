// form.spec.ts — spec for NEO-PGEN-03, the html-form case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the tag
// whose probe is missing, misnamed, unpainted, unmarked, or leaking a
// styling key, or the native behavior that never fired, on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose click and fill
// members the narrow SpecPage shape omits; this interface names just them.
interface InteractPage {
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
}

// Probe id plus dom tag for every form probe: 13 family members with the
// two inputs and two options pinned individually. The spec asserts each
// probe's element name, paint, marker, layer stamp, and styling-key
// absence before proving native behavior.
const EXPECTED_PROBES: Array<readonly [string, string]> = [
  ['form-button', 'button'],
  ['form-datalist', 'datalist'],
  ['form-fieldset', 'fieldset'],
  ['form-legend', 'legend'],
  ['form-text', 'input'],
  ['form-check', 'input'],
  ['form-label', 'label'],
  ['form-meter', 'meter'],
  ['form-output', 'output'],
  ['form-progress', 'progress'],
  ['form-select', 'select'],
  ['form-optgroup', 'optgroup'],
  ['form-option-a', 'option'],
  ['form-option-b', 'option'],
  ['form-textarea', 'textarea'],
];

// All probes share one class, so the sheet carries exactly the brand
// utility and nothing else.
function assertSheet(worldDir: string): void {
  const styles = fs.readFileSync(
    path.join(worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-pgen3__c_brand'), 'sheet carries the brand utility');
  const utilityCount = styles.match(/\.neo-pgen3__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
}

// One locator read per pinned probe: element name, brand paint, marker,
// layer stamp, and styling-key absence.
async function assertIdentity(page: SpecPage): Promise<void> {
  // One visibility wait establishes the render; the per-probe reads use
  // evaluate alone because hidden probes (datalist, optgroup, options)
  // never become visible yet still resolve, paint, and stamp.
  const root = page.locator('#form-root');
  await root.waitFor();
  const first = page.locator('#form-button');
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
      'neo-pgen3',
      `probe ${id} stamps the system layer`,
    );
    assert.equal(
      await probe.evaluate((el) => el.getAttribute('color')),
      null,
      `color stays off the ${id} element`,
    );
    assert.equal(
      await probe.evaluate((el) => getComputedStyle(el).color),
      'rgb(124, 58, 237)',
      `probe ${id} paints brand`,
    );
  }
}

// Fill lands, the checkbox checks, the button fires, and select,
// textarea, meter, and label report their native state.
async function assertNative(page: SpecPage): Promise<void> {
  const interact = page as unknown as InteractPage;
  const text = page.locator('#form-text');
  await text.waitFor();
  assert.equal(
    await text.evaluate((el) => (el as HTMLInputElement).value),
    'hello',
    'text input carries its default value',
  );
  await interact.fill('#form-text', 'typed');
  assert.equal(
    await text.evaluate((el) => (el as HTMLInputElement).value),
    'typed',
    'fill lands in the text input',
  );

  const check = page.locator('#form-check');
  await check.waitFor();
  assert.equal(
    await check.evaluate((el) => (el as HTMLInputElement).checked),
    false,
    'checkbox starts unchecked',
  );
  await interact.click('#form-check');
  assert.equal(
    await check.evaluate((el) => (el as HTMLInputElement).checked),
    true,
    'a click checks the checkbox natively',
  );

  const button = page.locator('#form-button');
  await button.waitFor();
  assert.equal(
    await button.evaluate((el) => el.getAttribute('type')),
    'submit',
    'button type passes through',
  );
  const clicks = page.locator('#clicks');
  await clicks.waitFor();
  await interact.click('#form-button');
  assert.equal(
    await clicks.evaluate((el) => el.textContent),
    'clicked',
    'button click handler fires through the primitive',
  );
  await assertSelectState(page);
}

// Select, textarea, meter, and label report their native state.
async function assertSelectState(page: SpecPage): Promise<void> {
  const select = page.locator('#form-select');
  await select.waitFor();
  assert.equal(
    await select.evaluate((el) => (el as HTMLSelectElement).value),
    'b',
    'select reports its default value',
  );
  assert.equal(
    await select.evaluate((el) => (el as HTMLSelectElement).selectedIndex),
    1,
    'select selects the grouped option natively',
  );
  const textarea = page.locator('#form-textarea');
  await textarea.waitFor();
  assert.equal(
    await textarea.evaluate((el) => (el as HTMLTextAreaElement).value),
    'text',
    'textarea carries its default value',
  );
  const meter = page.locator('#form-meter');
  await meter.waitFor();
  assert.equal(
    await meter.evaluate((el) => (el as HTMLMeterElement).value),
    0.5,
    'meter reports its native value',
  );
  const label = page.locator('#form-label');
  await label.waitFor();
  assert.equal(
    await label.evaluate((el) => el.getAttribute('for')),
    'form-text',
    'label for passes through',
  );
}

// Identity, paint, markers, and silence first; native behavior second.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheet(c.worldDir);
  await assertIdentity(page);
  await assertNative(page);
}
