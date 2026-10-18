// dangling-link.spec.ts — spec for NEO-WATCH-24, a dangling symlink under include. Takes { case } from the runner and
// asserts through the real `ref sync --json` CLI on a temp world: a link under theme/ whose target is gone must not
// fail the sync. The exit is 0, the CSS sheet and the tasty types both carry the world, and exactly one warning in the
// diagnostics array names the link. Emits nothing on success; throws naming the failed leg on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { disposeWorld, makeWorld, outOf, runCli } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface DiagnosticRow {
  severity?: unknown;
  message?: unknown;
}

const LINK_REL = path.join('theme', 'dangling.ts');
const LINK_NAME = 'theme/dangling.ts';
const LINK_TARGET = path.join('..', 'nowhere.ts');
const SHAPE_NAME = 'NeoWatch24Shape';
const SHAPE_SOURCE = `export interface ${SHAPE_NAME} {\n  a: number\n}\n`;
const BRAND_VAR = /--colors-brand:\s*#7c3aed/;

// Every file under the generated types folder; the tasty manifest and its chunks live there.
function filesUnder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

function typesCarry(worldDir: string, name: string): boolean {
  return filesUnder(path.join(outOf(worldDir), 'types')).some((file) => fs.readFileSync(file, 'utf8').includes(name));
}

// The last stdout line is the --json diagnostics array; a failed sync prints none, so the parse is the first failure.
function diagnosticRows(stdout: string): DiagnosticRow[] {
  const lastLine = stdout.trim().split('\n').at(-1) ?? '';
  return JSON.parse(lastLine) as DiagnosticRow[];
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld(['theme/**/*.{ts,tsx}']);
  try {
    fs.writeFileSync(path.join(dir, 'theme', 'shape.ts'), SHAPE_SOURCE);
    fs.symlinkSync(LINK_TARGET, path.join(dir, LINK_REL));

    const sync = await runCli(['sync', '--json', dir], dir);
    assert.equal(sync.code, 0, `a sync with a dangling link under include exits 0, got ${sync.code}: ${sync.output}`);
    assert.doesNotMatch(sync.output, /Build failed|sync failed/, `the types build completes: ${sync.output}`);

    const sheet = fs.readFileSync(path.join(outOf(dir), 'styled', 'styles.css'), 'utf8');
    assert.match(sheet, BRAND_VAR, 'the CSS sheet carries the world brand token');
    assert.ok(typesCarry(dir, SHAPE_NAME), `the tasty types index ${SHAPE_NAME} from theme/shape.ts`);

    const naming = diagnosticRows(sync.stdout).filter(
      (row) => row.severity === 'warning' && typeof row.message === 'string' && row.message.includes(LINK_NAME)
    );
    assert.equal(naming.length, 1, `exactly one warning names the dangling link, got ${naming.length}: ${sync.stdout}`);
  } finally {
    disposeWorld(dir);
  }
}
