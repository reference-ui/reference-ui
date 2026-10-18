// include-matches-nothing.spec.ts — spec for CORE-WATCH-23, an include glob that matches no files. Takes { case } from the
// runner and asserts node-side: a temp world whose only include reaches nothing must still exit 0, name the dead
// pattern in the verbose warning, and carry the same warning as a row in the --json diagnostics array. Emits nothing
// on success; throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import type { CoreCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { disposeWorld, makeWorld, runCli } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: CoreCase;
}

interface DiagnosticRow {
  severity?: unknown;
  message?: unknown;
}

const DEAD_PATTERN = 'nothing/**/*.ts';

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld([DEAD_PATTERN]);
  try {
    const human = await runCli(['sync', '--verbose', dir], dir);
    assert.equal(human.code, 0, `a sync whose include matches nothing exits 0, got ${human.code}: ${human.output}`);
    assert.match(
      human.output,
      /include matched no files: 'nothing\/\*\*\/\*\.ts'/,
      `the verbose output names the dead include: ${human.output}`
    );

    const machine = await runCli(['sync', '--json', dir], dir);
    assert.equal(machine.code, 0, `the --json sync exits 0, got ${machine.code}: ${machine.output}`);
    const lastLine = machine.stdout.trim().split('\n').at(-1) ?? '';
    const rows = JSON.parse(lastLine) as DiagnosticRow[];
    assert.ok(
      rows.some((row) => row.severity === 'warning' && typeof row.message === 'string' && row.message.includes(DEAD_PATTERN)),
      `the --json diagnostics carry the same warning: ${machine.stdout}`
    );
  } finally {
    disposeWorld(dir);
  }
}
