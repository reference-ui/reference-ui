// hostless.spec.ts — spec for NEO-SITE-14, the hostless-world case. Takes
// { case } from the runner with the world freshly synced; the page stays
// parked because the census is node-side over the sheet plus a frozen
// recompile. Emits nothing on success; throws naming the stray utility,
// the missing closed failure, or the unlocated diagnostic on failure.
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
  compile(request: unknown): Promise<{
    diagnostics: AtomicDiagnostic[];
    wants: unknown[];
    runtime: Record<string, unknown>;
  }>;
}

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The hostless tag yields zero utilities in the synced sheet instead of
// scanning every tag; the frozen request recompiled with emptied hosts
// fails closed with the located no-hosts error and zero wants or plans.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  const utilityCount = styles.match(/\.neo-site14__/g)?.length ?? 0;
  assert.equal(utilityCount, 0, `sheet carries zero hostless utilities, got ${utilityCount}`);
  assert.ok(!styles.includes('mt_4r'), 'no stray margin utility reaches the sheet');

  const request = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system/compile-request.json'), 'utf8'),
  ) as { jsxHosts: string[] };
  assert.ok(request.jsxHosts.length > 0, 'the frozen request carries the admitted hosts');
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule;
  const result = await atomic.compile({ ...request, jsxHosts: [] });
  const errors = (result.diagnostics ?? []).filter(
    (entry: AtomicDiagnostic) => entry.severity === 'error',
  );
  assert.equal(errors.length, 1, `one closed failure, got ${JSON.stringify(errors)}`);
  assert.ok(
    errors[0].message.includes('no StyleProps hosts resolvable'),
    `the failure names the unresolvable hosts, got ${errors[0].message}`,
  );
  assert.ok(
    errors[0].file?.endsWith(path.join('src', 'app.tsx')),
    `the failure is located at the world app.tsx, got ${errors[0].file}`,
  );
  assert.equal(errors[0].line, 13, `the failure points at the Foo tag, got ${errors[0].line}`);
  assert.equal(typeof errors[0].column, 'number', 'the failure carries a column');
  assert.equal(result.wants.length, 0, 'the closed failure extracts zero wants');
  assert.ok(!('stylePlans' in result.runtime), 'the closed failure ships no per-atom row');
}
