// union.spec.ts — spec for NEO-SITE-18, the spread-union case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing utility or the unpainted declaration on failure.
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

// The sheet unions the static key with both spread arms, the node carries
// the winning arm's class, and the winning padding paints. Sync succeeds
// (the case runs at all) and the frozen recompile is diagnostic-free.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-18__p_0 {'), 'sheet carries the static key');
  assert.ok(styles.includes('.neo-site-18__p_10px {'), 'sheet carries the winning arm');
  assert.ok(styles.includes('.neo-site-18__p_20px {'), 'sheet carries the losing arm');
  const utilityCount = styles.match(/\.neo-site-18__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the three union utilities, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  const className = await target.evaluate((el) => (el as HTMLElement).className);
  assert.ok(
    className.includes('neo-site-18__p_10px'),
    `node carries the winning arm class, got ${className}`,
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).paddingTop),
    '10px',
    'winning padding paints',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  assert.equal((result.diagnostics ?? []).length, 0, `zero diagnostics, got ${JSON.stringify(result.diagnostics)}`);
}
