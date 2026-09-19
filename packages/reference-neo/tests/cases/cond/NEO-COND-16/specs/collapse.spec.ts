// collapse.spec.ts — spec for NEO-COND-16, the icon-only collapse case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws
// naming the missing rule or the mispainted button on failure.
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

// The sheet carries the bare padding utility plus the substituted
// :where(:has()) rule, the icon-only button collapses to 0px, and the
// text button keeps 20px. Sync succeeds (the case runs at all) and the
// frozen recompile is diagnostic-free.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-cond-16__px_20px {'), 'sheet carries the bare utility');
  assert.ok(
    styles.includes(':where(:has(> [data-slot="icon"]:only-child, > svg:only-child))'),
    'sheet carries the substituted where/has rule',
  );
  const utilityCount = styles.match(/\.neo-cond-16__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  const iconOnly = page.locator('#iconOnly');
  await iconOnly.waitFor();
  assert.equal(
    await iconOnly.evaluate((el) => getComputedStyle(el).paddingInlineStart),
    '0px',
    'icon-only button collapses',
  );

  const text = page.locator('#text');
  await text.waitFor();
  assert.equal(
    await text.evaluate((el) => getComputedStyle(el).paddingInlineStart),
    '20px',
    'text button keeps base padding',
  );

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  assert.equal((result.diagnostics ?? []).length, 0, `zero diagnostics, got ${JSON.stringify(result.diagnostics)}`);
}
