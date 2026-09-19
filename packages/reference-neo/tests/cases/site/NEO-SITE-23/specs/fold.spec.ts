// fold.spec.ts — spec for NEO-SITE-23, the element-access and folded-key
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the missing utility, the unpainted declaration, or the missing
// refusal warning on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

// The rs dist type entries cannot resolve under NodeNext (see
// src/sync/native.ts), so the recompile below describes the call boundary
// structurally instead of importing the atomic types.
interface AtomicDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
}

interface AtomicModule {
  compile(request: unknown): Promise<{ diagnostics: AtomicDiagnostic[] }>;
}

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Every folded shape paints; the refused index paints nothing. Sync
// succeeds (the case runs at all), the sheet carries exactly the eleven
// utilities, the target paints its four folded declarations, the flattened
// array paints base padding narrow and lg padding wide in its container,
// the merge paints last-wins pink, the refused node paints only its
// sibling, and the frozen request still reports the located dk warning.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheet(c);
  await assertTarget(page);
  await assertFlat(page);
  await assertMerge(page);
  await assertRefused(page);
  await assertWarning(c);
}

// The sheet carries exactly the eleven folded utilities plus the three
// breakpoint container rules the flattened array rides.
function assertSheet(c: NeoCase): void {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  for (const utility of [
    '.neo-site-23__c_blue {',
    '.neo-site-23__bg-c_red {',
    '.neo-site-23__m_8px {',
    '.neo-site-23__p_12px {',
    '.neo-site-23__p_1px {',
    '.neo-site-23__c_green {',
    '.neo-site-23__c_pink {',
    '.neo-site-23__m_6px {',
  ]) {
    assert.ok(styles.includes(utility), `sheet carries ${utility}`);
  }
  assert.ok(styles.includes('@container (min-width: 640px)'), 'sheet carries the sm rule');
  assert.ok(styles.includes('@container (min-width: 768px)'), 'sheet carries the md rule');
  assert.ok(styles.includes('@container (min-width: 1024px)'), 'sheet carries the lg rule');
  const utilityCount = styles.match(/\.neo-site-23__/g)?.length ?? 0;
  assert.equal(utilityCount, 11, `sheet carries exactly the eleven utilities, got ${utilityCount}`);
}

// The target carries the four folded classes and paints every declaration:
// the identifier index, the literal index, the const-array read, the key.
async function assertTarget(page: SpecPage): Promise<void> {
  const target = page.locator('#target');
  await target.waitFor();
  assert.equal(
    await target.evaluate((el) => (el as HTMLElement).className),
    'neo-site-23__c_blue neo-site-23__bg-c_red neo-site-23__m_8px neo-site-23__p_12px',
    'target carries the four folded classes',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).color),
    'rgb(0, 0, 255)',
    'folded identifier index paints blue',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(255, 0, 0)',
    'literal index paints red',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).marginTop),
    '8px',
    'const-array read paints',
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).paddingTop),
    '12px',
    'folded key paints',
  );
}

// The flattened array carries four breakpoint classes and paints base
// padding narrow, lg padding wide when its container widens.
async function assertFlat(page: SpecPage): Promise<void> {
  const flat = page.locator('#flat');
  await flat.waitFor();
  const flatClasses = await flat.evaluate((el) => (el as HTMLElement).className.split(' '));
  assert.equal(flatClasses.length, 4, `flat carries four breakpoint classes, got ${flatClasses}`);
  assert.equal(
    await flat.evaluate((el) => getComputedStyle(el).paddingTop),
    '1px',
    'narrow container paints base padding',
  );
  const flatbox = page.locator('#flatbox');
  await flatbox.evaluate((el) => {
    (el as HTMLElement).style.width = '1100px';
  });
  assert.equal(
    await flat.evaluate((el) => getComputedStyle(el).paddingTop),
    '4px',
    'wide container paints lg padding',
  );
}

// The flattened merge list paints last-wins pink.
async function assertMerge(page: SpecPage): Promise<void> {
  const merge = page.locator('#merge');
  await merge.waitFor();
  assert.equal(
    await merge.evaluate((el) => getComputedStyle(el).color),
    'rgb(255, 192, 203)',
    'flattened merge paints last-wins pink',
  );
}

// The refused node carries only its sibling class: the dynamic index
// paints nothing while the margin sibling paints.
async function assertRefused(page: SpecPage): Promise<void> {
  const refused = page.locator('#refused');
  await refused.waitFor();
  assert.equal(
    await refused.evaluate((el) => (el as HTMLElement).className),
    'neo-site-23__m_6px',
    'refused node carries only the sibling class',
  );
  assert.equal(
    await refused.evaluate((el) => getComputedStyle(el).color),
    'rgb(0, 0, 0)',
    'dynamic index paints nothing',
  );
  assert.equal(
    await refused.evaluate((el) => getComputedStyle(el).marginTop),
    '6px',
    'refused sibling margin paints',
  );
}

// A fresh compile of the frozen request reports the dk warning located
// at the world's app.ts — the refusal is diagnosed, never silent.
async function assertWarning(c: NeoCase): Promise<void> {
  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  const warnings = (result.diagnostics ?? []).filter(
    (entry: AtomicDiagnostic) => entry.severity === 'warning' && entry.message.includes("'dk'"),
  );
  assert.equal(warnings.length, 1, `one located dk warning, got ${JSON.stringify(result.diagnostics)}`);
  assert.ok(
    warnings[0].file?.endsWith(path.join('src', 'app.ts')),
    `warning is located at the world app.ts, got ${warnings[0].file}`,
  );
}
