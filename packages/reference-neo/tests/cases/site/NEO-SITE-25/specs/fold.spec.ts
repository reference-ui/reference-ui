// fold.spec.ts — spec for NEO-SITE-25, the binary-fold paint case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility, the unpainted declaration, or the missing refusal warning
// on failure.
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

// Every folded shape paints; dead arms and the refused position paint
// nothing. Sync succeeds (the case runs at all), the sheet carries exactly
// the fourteen folded utilities, each probe node paints its folded
// declarations, the refused node paints only its sibling, and the frozen
// request still reports the located pipe warning.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheet(c);
  await assertArith(page);
  await assertLogic(page);
  await assertNullish(page);
  await assertCompare(page);
  await assertMember(page);
  await assertRefused(page);
  await assertWarning(c);
}

// The sheet carries exactly the fourteen folded utilities: four arithmetic
// and concat folds, two picked operands per short-circuit node, three live
// ternary arms, three member reads, and the refused sibling.
function assertSheet(c: NeoCase): void {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  for (const utility of [
    '.neo-site-25__order_5 {',
    '.neo-site-25__z_8 {',
    '.neo-site-25__w_1px {',
    '.neo-site-25__m_4px {',
    '.neo-site-25__c_red {',
    '.neo-site-25__bg-c_blue {',
    '.neo-site-25__c_teal {',
    '.neo-site-25__bg-c_red {',
    '.neo-site-25__c_white {',
    '.neo-site-25__p_1px {',
    '.neo-site-25__c_\\#f00 {',
    '.neo-site-25__bg-c_purple {',
    '.neo-site-25__order_2 {',
    '.neo-site-25__m_6px {',
  ]) {
    assert.ok(styles.includes(utility), `sheet carries ${utility}`);
  }
  for (const dead of [
    '.neo-site-25__c_black {',
    '.neo-site-25__p_2px {',
    '.neo-site-25__c_x {',
  ]) {
    assert.ok(!styles.includes(dead), `sheet withholds dead arm ${dead}`);
  }
  const utilityCount = styles.match(/\.neo-site-25__/g)?.length ?? 0;
  assert.equal(utilityCount, 14, `sheet carries exactly the fourteen utilities, got ${utilityCount}`);
}

// The node carries exactly these classes in any order.
async function assertClasses(page: SpecPage, id: string, wanted: string[]): Promise<void> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  const actual = await node.evaluate((el) => (el as HTMLElement).className.split(' ').sort());
  assert.deepEqual(actual, [...wanted].sort(), `#${id} carries the folded classes`);
}

// Arithmetic and concat fold over literal, ident, and mixed operands.
async function assertArith(page: SpecPage): Promise<void> {
  await assertClasses(page, 'arith', [
    'neo-site-25__order_5',
    'neo-site-25__z_8',
    'neo-site-25__w_1px',
    'neo-site-25__m_4px',
  ]);
  const node = page.locator('#arith');
  const got = await node.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    return { order: style.order, zIndex: style.zIndex, width: style.width, margin: style.marginTop };
  });
  assert.equal(got.order, '5', 'addition folds');
  assert.equal(got.zIndex, '8', 'multiplication over an ident folds');
  assert.equal(got.width, '1px', 'number-plus-string concats');
  assert.equal(got.margin, '4px', 'ident-plus-string concats');
}

// All-literal short-circuit paints the picked operand only.
async function assertLogic(page: SpecPage): Promise<void> {
  await assertClasses(page, 'logic', ['neo-site-25__c_red', 'neo-site-25__bg-c_blue']);
  const node = page.locator('#logic');
  const got = await node.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  assert.equal(got.color, 'rgb(255, 0, 0)', 'truthy && picks right');
  assert.equal(got.backgroundColor, 'rgb(0, 0, 255)', 'falsy || picks right');
}

// Nullish-left takes the right side; present-left keeps the left.
async function assertNullish(page: SpecPage): Promise<void> {
  await assertClasses(page, 'nullish', ['neo-site-25__c_teal', 'neo-site-25__bg-c_red']);
  const node = page.locator('#nullish');
  const got = await node.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  assert.equal(got.color, 'rgb(0, 128, 128)', 'nullish ?? takes right');
  assert.equal(got.backgroundColor, 'rgb(255, 0, 0)', 'present ?? keeps left');
}

// Folded ternary tests paint the live arm; the dead arm mints nothing.
async function assertCompare(page: SpecPage): Promise<void> {
  await assertClasses(page, 'compare', [
    'neo-site-25__c_white',
    'neo-site-25__bg-c_red',
    'neo-site-25__p_1px',
  ]);
  const node = page.locator('#compare');
  const got = await node.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    return { color: style.color, backgroundColor: style.backgroundColor, padding: style.paddingTop };
  });
  assert.equal(got.color, 'rgb(255, 255, 255)', 'strict-equal test');
  assert.equal(got.backgroundColor, 'rgb(255, 0, 0)', 'const-bound test');
  assert.equal(got.padding, '1px', 'arithmetic test');
}

// Multi-hop member reads resolve through nested const objects.
async function assertMember(page: SpecPage): Promise<void> {
  await assertClasses(page, 'member', [
    'neo-site-25__c_#f00',
    'neo-site-25__bg-c_purple',
    'neo-site-25__order_2',
  ]);
  const node = page.locator('#member');
  const got = await node.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    return { color: style.color, backgroundColor: style.backgroundColor, order: style.order };
  });
  assert.equal(got.color, 'rgb(255, 0, 0)', 'two-hop read paints');
  assert.equal(got.backgroundColor, 'rgb(128, 0, 128)', 'three-hop read paints');
  assert.equal(got.order, '2', 'one-hop read paints');
}

// The refused node carries only its sibling class: the bitwise position
// paints nothing while the margin sibling paints.
async function assertRefused(page: SpecPage): Promise<void> {
  await assertClasses(page, 'refused', ['neo-site-25__m_6px']);
  const node = page.locator('#refused');
  const got = await node.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    return { order: style.order, margin: style.marginTop };
  });
  assert.equal(got.order, '0', 'bitwise paints nothing');
  assert.equal(got.margin, '6px', 'refused sibling margin paints');
}

// A fresh compile of the frozen request reports the pipe warning located
// at the world's app.ts — the refusal is diagnosed, never silent.
async function assertWarning(c: NeoCase): Promise<void> {
  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  const warnings = (result.diagnostics ?? []).filter(
    (entry: AtomicDiagnostic) => entry.severity === 'warning' && entry.message.includes("operator '|'"),
  );
  assert.equal(warnings.length, 1, `one located pipe warning, got ${JSON.stringify(result.diagnostics)}`);
  assert.ok(
    warnings[0].file?.endsWith(path.join('src', 'app.ts')),
    `warning is located at the world app.ts, got ${warnings[0].file}`,
  );
}
