// refuse.spec.ts — spec for NEO-SITE-24, the non-object-args case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming any
// ghost paint, any unpainted sibling, or any missing refusal warning.
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
  line?: number;
  column?: number;
}

interface AtomicModule {
  compile(request: unknown): Promise<{ diagnostics: AtomicDiagnostic[] }>;
}

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const EXPECTED_WARNINGS: Array<{ line: number; message: string }> = [
  { line: 19, message: "css() argument 1 is not a static style object (identifier 'cond')" },
  { line: 22, message: 'tagged template is not a css() site; use css({...})' },
];

// The sibling arg and the spread twin paint; the whole-object arg lowers
// beside its live sibling (ocean wins the merge), the arg-level && lowers
// its object right while the const-true left diagnoses, and only the live
// tag paints nothing. The sheet carries exactly the three surviving
// utilities, and the frozen recompile carries exactly the two positioned
// refusal warnings.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const utilityCount = styles.match(/\.neo-site-24__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the sibling + twin + logical utilities, got ${utilityCount}`);

  const painted: Array<{ id: string; rgb: string }> = [
    { id: 'sibling', rgb: 'rgb(37, 99, 235)' },
    { id: 'spread', rgb: 'rgb(220, 38, 38)' },
    // CSS `plum`, not the world token: a complete CSS value is never a token
    // path (Forge §9 fence, H1 — CSS wins over tokens). See the README.
    { id: 'logical', rgb: 'rgb(221, 160, 221)' },
  ];
  for (const { id, rgb } of painted) {
    const node = page.locator(`#${id}`);
    await node.waitFor();
    const color = await node.evaluate((el) => getComputedStyle(el).color);
    assert.equal(color, rgb, `#${id} paints ${rgb}, got ${color}`);
  }
  for (const id of ['tagged']) {
    const node = page.locator(`#${id}`);
    const color = await node.evaluate((el) => getComputedStyle(el).color);
    assert.equal(color, 'rgb(0, 0, 0)', `#${id} paints nothing, got ${color}`);
  }

  const request = JSON.parse(
    fs.readFileSync(path.join(c.worldDir, '.reference-ui/system/compile-request.json'), 'utf8'),
  );
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile(request);
  const warnings = result.diagnostics ?? [];
  assert.equal(warnings.length, 2, `two refusal warnings, got ${JSON.stringify(warnings)}`);
  for (const expected of EXPECTED_WARNINGS) {
    const match = warnings.find(
      (entry) => entry.message === expected.message && entry.line === expected.line,
    );
    assert.ok(match, `missing warning ${expected.line}: ${expected.message}`);
    assert.equal(match!.severity, 'warning');
    assert.ok(
      match!.file?.endsWith(path.join('src', 'app.ts')),
      `warning is located at the world app.ts, got ${match!.file}`,
    );
    assert.ok(match!.column, 'warning carries a column');
  }
}
