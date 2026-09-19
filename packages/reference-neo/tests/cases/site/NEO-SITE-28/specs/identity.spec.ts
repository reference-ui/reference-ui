// identity.spec.ts — spec for NEO-SITE-28, the re-export identity case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws naming
// any unpainted live or chain node, any painted miss, any sheet surplus, or
// any recompile diagnostic on failure.
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

// Both wrapper nodes paint through the binding walk; the shadow-wrapper
// node paints nothing with zero diagnostics — a silent non-site.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-28__c_cherry {'), 'sheet carries the live utility');
  assert.ok(styles.includes('.neo-site-28__c_ocean {'), 'sheet carries the chain utility');
  const utilityCount = styles.match(/\.neo-site-28__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the two utilities, got ${utilityCount}`);

  const live = page.locator('#live');
  await live.waitFor();
  const liveColor = await live.evaluate((el) => getComputedStyle(el).color);
  assert.equal(liveColor, 'rgb(220, 38, 38)', `live paints cherry, got ${liveColor}`);
  const link = page.locator('#link');
  const linkColor = await link.evaluate((el) => getComputedStyle(el).color);
  assert.equal(linkColor, 'rgb(37, 99, 235)', `link paints ocean, got ${linkColor}`);
  const miss = page.locator('#miss');
  const missColor = await miss.evaluate((el) => getComputedStyle(el).color);
  assert.equal(missColor, 'rgb(0, 0, 0)', `miss paints nothing, got ${missColor}`);

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  assert.equal(
    (result.diagnostics ?? []).length,
    0,
    `recompile carries zero diagnostics, got ${JSON.stringify(result.diagnostics)}`,
  );
}
