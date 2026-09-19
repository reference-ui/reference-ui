// paint.spec.ts — spec for NEO-SITE-20, the wrapped-args case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// unpainted wrap, any missing utility, or any unexpected diagnostic.
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

const PROBES: Array<{ id: string; rgb: string }> = [
  { id: 'bare', rgb: 'rgb(220, 38, 38)' },
  { id: 'paren', rgb: 'rgb(234, 88, 12)' },
  { id: 'asconst', rgb: 'rgb(245, 158, 11)' },
  { id: 'satisfies', rgb: 'rgb(21, 128, 61)' },
  { id: 'nonnull', rgb: 'rgb(37, 99, 235)' },
  // CSS `plum`, not the world token: a complete CSS value is never a token
  // path (Forge §9 fence, H1 — CSS wins over tokens). See the README.
  { id: 'asserted', rgb: 'rgb(221, 160, 221)' },
];

// Every wrap form paints its leaf, the sheet carries exactly the six
// utilities, and the frozen recompile carries zero diagnostics.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const utilityCount = styles.match(/\.neo-site-20__/g)?.length ?? 0;
  assert.equal(utilityCount, 6, `sheet carries exactly the six wrap utilities, got ${utilityCount}`);

  for (const { id, rgb } of PROBES) {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    const color = await node.evaluate((el) => getComputedStyle(el).color);
    assert.equal(color, rgb, `#${id} paints ${rgb}, got ${color}`);
  }

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  assert.equal((result.diagnostics ?? []).length, 0, `zero diagnostics, got ${JSON.stringify(result.diagnostics)}`);
}
