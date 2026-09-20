// refuse.spec.ts — spec for NEO-SITE-21, the impure-refusal case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// painted refusal, any missing sibling, or any unexpected diagnostic.
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

// The sheet carries the static margin siblings plus the fenced pure-helper
// color, the margins paint, the refused helper colors leave the default
// text color, and the pure color paints blue. Sync succeeds (the case runs
// at all) and the frozen recompile carries the two positioned refusal
// warnings.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-21__m_10px {'), 'sheet carries the random sibling');
  assert.ok(styles.includes('.neo-site-21__m_20px {'), 'sheet carries the async sibling');
  assert.ok(styles.includes('.neo-site-21__m_30px {'), 'sheet carries the pure sibling');
  assert.ok(styles.includes('.neo-site-21__c_blue {'), 'sheet carries the pure-helper color');
  const utilityCount = styles.match(/\.neo-site-21__/g)?.length ?? 0;
  assert.equal(utilityCount, 4, `sheet carries exactly the four utilities, got ${utilityCount}`);

  for (const [id, margin] of [['random', '10px'], ['async', '20px']] as const) {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    assert.equal(
      await node.evaluate((el) => getComputedStyle(el).marginTop),
      margin,
      `#${id} sibling margin paints`,
    );
    assert.equal(
      await node.evaluate((el) => getComputedStyle(el).color),
      'rgb(0, 0, 0)',
      `#${id} refused color paints nothing`,
    );
  }

  const pure = page.locator('#pure');
  await pure.waitFor();
  assert.equal(
    await pure.evaluate((el) => getComputedStyle(el).marginTop),
    '30px',
    '#pure sibling margin paints',
  );
  assert.equal(
    await pure.evaluate((el) => getComputedStyle(el).color),
    'rgb(0, 0, 255)',
    '#pure fenced-helper color paints',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  // S6 E8-class re-point: refusals prove no exact runtime miss, so the
  // default is silent; the same lines ride the opt-in channel.
  assert.equal((result.diagnostics ?? []).length, 0, `default is silent, got ${JSON.stringify(result.diagnostics)}`);
  const opted = await atomic.compile({ ...request, logs: ['compiler'] });
  assert.ok(opted.compilerDiagnostics, 'opt-in channel populates compilerDiagnostics');
  const diagnostics = opted.compilerDiagnostics ?? [];
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning');
  const infos = diagnostics.filter((diagnostic) => diagnostic.code === 'ATM-I-HARVEST-SINK');
  assert.equal(warnings.length, 2, `two refusal warnings, got ${JSON.stringify(diagnostics)}`);
  for (const diagnostic of warnings) {
    assert.match(diagnostic.message, /Dynamic non-literal/);
  }
  assert.equal(infos.length, 1, `one zero-count sink info, got ${JSON.stringify(diagnostics)}`);
}
