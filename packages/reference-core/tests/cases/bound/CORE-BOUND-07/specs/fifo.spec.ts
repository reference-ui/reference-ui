// fifo.spec.ts — spec for CORE-BOUND-07: a FIFO named like a source, synced under a budget. It takes { case } from the
// runner and builds two temp projects from the committed world: a baseline as committed, and a FIFO project with a FIFO
// made by mkfifo at src/pipe.ts and a link src/pipe-link.ts -> pipe.ts. Each project is synced through the spawned bin
// under a 10 s budget: both must exit 0 with no tasty build failure printed, and the two stylesheets must be
// byte-identical. Emits nothing on success; throws naming the failed leg on failure. Both temp projects are removed in a
// finally, so a child killed by its budget leaves nothing behind. Windows has no mkfifo, so the spec returns there.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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

// A fresh copy of the committed world, with its real path so every sync resolves the same root.
function copyWorld(): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-bound-07-')));
  cpSync(WORLD_DIR, dir, { recursive: true });
  return dir;
}

// The FIFO world: a FIFO at src/pipe.ts and a relative link to it at src/pipe-link.ts.
function fifoWorld(): string {
  const dir = copyWorld();
  execFileSync('mkfifo', [path.join(dir, 'src', 'pipe.ts')]);
  symlinkSync('pipe.ts', path.join(dir, 'src', 'pipe-link.ts'));
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
    /TST-E-|tasty build failed/i,
    `${label}: ref sync prints no tasty build failure, got: ${output}`
  );
  return readFileSync(path.join(dir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

export default async function run(_input: SpecInput): Promise<void> {
  if (process.platform === 'win32') return;
  const baseline = copyWorld();
  const piped = fifoWorld();
  try {
    const plainSheet = syncLeg('baseline', baseline);
    const pipedSheet = syncLeg('fifo', piped);
    assert.match(plainSheet, /color: blue/, 'the baseline sheet carries the card colour');
    assert.equal(pipedSheet, plainSheet, 'the FIFO world writes the same stylesheet as the baseline');
  } finally {
    rmSync(baseline, { recursive: true, force: true });
    rmSync(piped, { recursive: true, force: true });
  }
}
