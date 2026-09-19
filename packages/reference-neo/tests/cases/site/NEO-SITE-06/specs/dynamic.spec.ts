// dynamic.spec.ts — spec for NEO-SITE-06, the dynamic-call case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// ghost utility, any missed sibling paint, or any missing warning on failure.
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

// The dynamic key warns and skips; the static sibling lands. Sync succeeds
// (the case runs at all), the sheet carries the ocean background utility
// plus the two harvested hex floors with no cherry ghost, the node paints
// the ocean background while keeping its default text color, and the frozen
// request still reports the located color warning.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-06__bg_ocean {'), 'sheet carries the static sibling');
  assert.ok(!styles.includes('c_cherry'), 'no cherry ghost reaches the sheet');
  assert.ok(styles.includes('.neo-site-06__c_\\#dc2626 {'), 'sheet carries the harvested cherry-hex floor');
  assert.ok(styles.includes('.neo-site-06__c_\\#2563eb {'), 'sheet carries the harvested ocean-hex floor');
  const utilityCount = styles.match(/\.neo-site-06__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries the sibling utility plus the harvest floor, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  const background = await target.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(background, 'rgb(37, 99, 235)', `sibling paints ocean, got ${background}`);
  const color = await target.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(0, 0, 0)', `dynamic key paints nothing, got ${color}`);

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  const warnings = (result.diagnostics ?? []).filter(
    (entry: AtomicDiagnostic) => entry.severity === 'warning' && entry.message.includes("'color'"),
  );
  assert.equal(warnings.length, 1, `one located color warning, got ${JSON.stringify(result.diagnostics)}`);
  assert.ok(
    warnings[0].file?.endsWith(path.join('src', 'app.ts')),
    `warning is located at the world app.ts, got ${warnings[0].file}`,
  );
}
