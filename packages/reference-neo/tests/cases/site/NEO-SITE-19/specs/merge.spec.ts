// merge.spec.ts — spec for NEO-SITE-19, the merge-list case. Takes
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

// The sheet merges both list elements unconditioned, the node carries the
// last element's class, and the last margin paints. The falsy hole stays
// silent. Sync succeeds (the case runs at all) and the frozen recompile
// is diagnostic-free.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-19__m_10px {'), 'sheet carries the first element');
  assert.ok(styles.includes('.neo-site-19__m_20px {'), 'sheet carries the last element');
  const utilityCount = styles.match(/\.neo-site-19__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two merge utilities, got ${utilityCount}`);

  const target = page.locator('#target');
  await target.waitFor();
  const className = await target.evaluate((el) => (el as HTMLElement).className);
  assert.ok(
    className.includes('neo-site-19__m_20px'),
    `node carries the last element class, got ${className}`,
  );
  assert.equal(
    await target.evaluate((el) => getComputedStyle(el).marginTop),
    '20px',
    'last margin paints',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  assert.equal((result.diagnostics ?? []).length, 0, `zero diagnostics, got ${JSON.stringify(result.diagnostics)}`);
}
