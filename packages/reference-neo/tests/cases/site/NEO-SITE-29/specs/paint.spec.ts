// paint.spec.ts — spec for NEO-SITE-29, the nested-spread paint case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws naming
// any unpainted live node, any painted control, any sheet surplus, or any
// recompile diagnostic on failure.
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

// The nested import spread folds across the two files: the sheet carries
// the red utility and the padding sibling, the live node paints red while
// the control paints nothing, and the recompile reports zero diagnostics.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-29__c_red {'), 'sheet carries the folded color');
  assert.ok(styles.includes('.neo-site-29__p_4px {'), 'sheet carries the padding sibling');
  const utilityCount = styles.match(/\.neo-site-29__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  const live = page.locator('#live');
  await live.waitFor();
  const liveColor = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(liveColor, 'rgb(255, 0, 0)', `live paints red, got ${liveColor}`);
  const plain = page.locator('#plain');
  const plainColor = await plain.evaluate((el) => getComputedStyle(el).color);
  assert.equal(plainColor, 'rgb(0, 0, 0)', `control paints nothing, got ${plainColor}`);

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  assert.equal(
    (result.diagnostics ?? []).length,
    0,
    `recompile reports zero diagnostics, got ${JSON.stringify(result.diagnostics)}`,
  );
}
