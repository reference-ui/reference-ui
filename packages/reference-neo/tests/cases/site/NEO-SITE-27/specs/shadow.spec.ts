// shadow.spec.ts — spec for NEO-SITE-27, the param-shadow case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// cherry ghost, any unpainted twin, or any missing shadow warning on failure.
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
  compile(request: unknown): Promise<{
    diagnostics: AtomicDiagnostic[]
    compilerDiagnostics?: AtomicDiagnostic[]
  }>;
}

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The param shadows the cross-file const: no site utility, one located
// warning, nothing paints. The unshadowed twin still resolves and paints
// ocean, and the sheet carries the two harvested hex floors beside it.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-27__c_ocean {'), 'sheet carries the twin utility');
  assert.ok(!styles.includes('c_cherry'), 'no cherry ghost reaches the sheet');
  assert.ok(styles.includes('.neo-site-27__c_\\#2563eb {'), 'sheet carries the harvested ocean-hex floor');
  assert.ok(styles.includes('.neo-site-27__c_\\#dc2626 {'), 'sheet carries the harvested cherry-hex floor');
  const utilityCount = styles.match(/\.neo-site-27__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries the twin utility plus the harvest floor, got ${utilityCount}`);

  const twin = page.locator('#twin');
  await twin.waitFor();
  const twinColor = await twin.evaluate((el) => getComputedStyle(el).color);
  assert.equal(twinColor, 'rgb(37, 99, 235)', `twin paints ocean, got ${twinColor}`);
  const shadow = page.locator('#shadow');
  const shadowColor = await shadow.evaluate((el) => getComputedStyle(el).color);
  assert.equal(shadowColor, 'rgb(0, 0, 0)', `shadow paints nothing, got ${shadowColor}`);

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  // S6 E8-class re-point: the refusal proves no exact runtime miss, so the
  // default is silent; the same line rides the opt-in channel.
  assert.equal((result.diagnostics ?? []).length, 0, `default is silent, got ${JSON.stringify(result.diagnostics)}`);
  const opted = await atomic.compile({ ...request, logs: ['compiler'] });
  assert.ok(opted.compilerDiagnostics, 'opt-in channel populates compilerDiagnostics');
  const channel = opted.compilerDiagnostics ?? [];
  const warnings = channel.filter(
    (entry: AtomicDiagnostic) => entry.severity === 'warning' && entry.message.includes("'color'"),
  );
  assert.equal(warnings.length, 1, `one located color warning, got ${JSON.stringify(channel)}`);
  assert.ok(
    warnings[0].file?.endsWith(path.join('src', 'app.ts')),
    `warning is located at the world app.ts, got ${warnings[0].file}`,
  );
}
