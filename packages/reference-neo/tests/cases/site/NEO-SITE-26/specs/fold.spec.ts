// fold.spec.ts — spec for NEO-SITE-26, the interpolated-template case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// unpainted fold, any ghost on the refused node, or any missing part warning.
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
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
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

const EXPECTED_WARNING = {
  line: 26,
  message:
    "Dynamic non-literal template part 1 (identifier 'dyn') encountered for prop 'color'",
};

// The folded member part paints cherry, the sized number part paints 4px,
// the fan-out part paints the live plum arm, and the refused node paints
// only its ocean background sibling. The sheet carries the five folded
// utilities plus the three harvested hex floors, and the frozen recompile
// carries exactly the one positioned part warning.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-26__c_\\#dc2626 {'), 'sheet carries the harvested cherry-hex floor');
  assert.ok(styles.includes('.neo-site-26__c_\\#2563eb {'), 'sheet carries the harvested ocean-hex floor');
  assert.ok(styles.includes('.neo-site-26__c_\\#a855f7 {'), 'sheet carries the harvested purple-hex floor');
  const utilityCount = styles.match(/\.neo-site-26__/g)?.length ?? 0;
  assert.equal(utilityCount, 8, `sheet carries the folded utilities plus the harvest floor, got ${utilityCount}`);

  const folded = page.locator('#folded');
  await folded.waitFor();
  assert.equal(
    await folded.evaluate((el) => getComputedStyle(el).color),
    'rgb(220, 38, 38)',
    '#folded paints cherry',
  );

  const sized = page.locator('#sized');
  assert.equal(
    await sized.evaluate((el) => getComputedStyle(el).width),
    '4px',
    '#sized paints 4px wide',
  );

  const fan = page.locator('#fan');
  // CSS `plum`, not the world token: a complete CSS value is never a token
  // path (Forge §9 fence, H1 — CSS wins over tokens). See the README.
  assert.equal(
    await fan.evaluate((el) => getComputedStyle(el).color),
    'rgb(221, 160, 221)',
    '#fan paints the live plum arm',
  );

  const refused = page.locator('#refused');
  assert.equal(
    await refused.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(37, 99, 235)',
    '#refused paints its ocean sibling',
  );
  assert.equal(
    await refused.evaluate((el) => getComputedStyle(el).color),
    'rgb(0, 0, 0)',
    '#refused paints no color of its own',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  // S6 E8-class re-point: the refusal proves no exact runtime miss, so the
  // default is silent; the same lines ride the opt-in channel.
  assert.equal((result.diagnostics ?? []).length, 0, `default is silent, got ${JSON.stringify(result.diagnostics)}`);
  const opted = await atomic.compile({ ...request, logs: ['compiler'] });
  assert.ok(opted.compilerDiagnostics, 'opt-in channel populates compilerDiagnostics');
  const diagnostics = opted.compilerDiagnostics ?? [];
  const warnings = diagnostics.filter((entry) => entry.severity === 'warning');
  const infos = diagnostics.filter((entry) => entry.code === 'ATM-I-HARVEST-SINK');
  assert.equal(warnings.length, 1, `one part warning, got ${JSON.stringify(diagnostics)}`);
  assert.equal(infos.length, 1, `one sink info, got ${JSON.stringify(diagnostics)}`);
  const match = warnings.find(
    (entry) => entry.message === EXPECTED_WARNING.message && entry.line === EXPECTED_WARNING.line,
  );
  assert.ok(match, `missing warning ${EXPECTED_WARNING.line}: ${EXPECTED_WARNING.message}`);
  assert.equal(match!.severity, 'warning');
  assert.ok(
    match!.file?.endsWith(path.join('src', 'app.ts')),
    `warning is located at the world app.ts, got ${match!.file}`,
  );
  assert.ok(match!.column, 'warning carries a column');
}
