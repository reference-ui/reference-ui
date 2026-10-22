// loops.spec.ts — spec for CORE-BOUND-03: loops and a linked sibling, synced under a budget. It takes
// { case } from the runner and builds two temp projects from the committed world: a baseline whose palette is written out
// as real files, and a linked project with src/loopA -> ., src/loopB -> . and src/palette -> ../lib. Each project is synced
// through the spawned bin under a 10 s budget: both must exit 0 with no tasty build failure printed, and the two stylesheets
// must be byte-identical. Emits nothing on success; throws naming the failed leg on failure. Both temp projects are removed in a finally, so a child
// killed by its budget leaves nothing behind.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreCase } from '../../../../shared/cases.ts';

interface SpecInput {
  case: CoreCase;
}

const WORLD_DIR = fileURLToPath(new URL('../world', import.meta.url));
const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url));
const SYNC_BUDGET_MS = 10_000;
const PALETTE_LINK = path.join('src', 'palette');

// A fresh copy of the committed world, with its real path so every sync resolves the same root.
function copyWorld(): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-bound-03-')));
  cpSync(WORLD_DIR, dir, { recursive: true });
  return dir;
}

// The baseline: the sibling lib/ written out under src/, with no loop and no link anywhere.
function baselineWorld(): string {
  const dir = copyWorld();
  cpSync(path.join(WORLD_DIR, 'lib'), path.join(dir, PALETTE_LINK), { recursive: true });
  return dir;
}

// The linked world: two self-links back to src/, and a link from src/palette to the sibling lib/.
function linkedWorld(): string {
  const dir = copyWorld();
  symlinkSync('.', path.join(dir, 'src', 'loopA'));
  symlinkSync('.', path.join(dir, 'src', 'loopB'));
  symlinkSync(path.join('..', 'lib'), path.join(dir, PALETTE_LINK));
  return dir;
}

// One `ref sync` leg: the bin must exit 0 inside the budget, and its published stylesheet is returned.
function syncLeg(label: string, dir: string): string {
  const run = spawnSync(process.execPath, [BIN_PATH, 'sync', dir], {
    cwd: dir,
    encoding: 'utf8',
    timeout: SYNC_BUDGET_MS,
    killSignal: 'SIGKILL',
  });
  const reason = run.error ? ` (${run.error.message})` : '';
  assert.equal(
    run.status,
    0,
    `${label}: ref sync exits 0 inside ${SYNC_BUDGET_MS} ms, got status ${run.status} and signal ${run.signal}${reason}: ${run.stderr}`
  );
  const output = `${run.stdout}${run.stderr}`;
  assert.doesNotMatch(
    output,
    /TST-E-SCAN-FAILED|Build failed/,
    `${label}: ref sync prints no tasty build failure, got: ${output}`
  );
  return readFileSync(path.join(dir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

export default async function run(_input: SpecInput): Promise<void> {
  const baseline = baselineWorld();
  const linked = linkedWorld();
  try {
    const plainSheet = syncLeg('baseline', baseline);
    const linkedSheet = syncLeg('linked', linked);
    assert.match(plainSheet, /color: green/, 'the baseline sheet carries the sibling colour');
    assert.equal(linkedSheet, plainSheet, 'the linked world writes the same stylesheet as the baseline');
  } finally {
    rmSync(baseline, { recursive: true, force: true });
    rmSync(linked, { recursive: true, force: true });
  }
}
