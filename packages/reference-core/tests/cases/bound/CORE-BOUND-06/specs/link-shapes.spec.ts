// link-shapes.spec.ts is the spec for CORE-BOUND-06, which syncs three link shapes under a budget.
// It takes { case } from the runner and builds two temp projects from the committed world, each holding the same real styled files.
// The baseline has no links and writes src/a/up/x.ts out as a real copy of src/x.ts, while the linked project links the clique and the lattice and adds the loop-closing link src/a/up to src/.
// Each project is synced through the spawned bin under a 10 s budget: both must exit 0 with no tasty build failure printed, and the two stylesheets must be byte-identical.
// Emits nothing on success and throws naming the failed leg on failure; both temp projects are removed in a finally, so a child killed by its budget leaves nothing behind.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
const CLIQUE_SIZE = 7;
const LATTICE_LEVELS = 16;
const SIDES = ['a', 'b'];
const SCOPE_DIR = path.join('src', 'a');
const LOOP_LINK = path.join(SCOPE_DIR, 'up');

// A fresh copy of the committed world, with its real path so every sync resolves the same root.
function copyWorld(): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'core-bound-06-')));
  cpSync(WORLD_DIR, dir, { recursive: true });
  return dir;
}

function cliqueDir(root: string, index: number): string {
  return path.join(root, SCOPE_DIR, 'clique', `k${index}`);
}

function levelDir(root: string, level: number, side: string): string {
  return path.join(root, SCOPE_DIR, 'lattice', `n${level}`, side);
}

// One real styled file. Its padding is unique, so the stylesheet carries one rule for each file.
function writeStyled(dir: string, name: string, index: number): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, `${name}.ts`),
    `import { css } from '@reference-ui/react'\n\nexport const ${name} = css({ padding: '${index}px' })\n`,
    'utf8'
  );
}

// The real files both projects share: one per clique directory, then one per lattice directory.
function writeRealFiles(root: string): void {
  let index = 1;
  for (let k = 0; k < CLIQUE_SIZE; k++) {
    writeStyled(cliqueDir(root, k), `k${k}`, index++);
  }
  for (let level = 0; level < LATTICE_LEVELS; level++) {
    for (const side of SIDES) {
      writeStyled(levelDir(root, level, side), `n${level}${side}`, index++);
    }
  }
}

// Every clique directory links to the other six: k0/to_k1 is ../k1, and so on.
function linkClique(root: string): void {
  for (let from = 0; from < CLIQUE_SIZE; from++) {
    for (let to = 0; to < CLIQUE_SIZE; to++) {
      if (to !== from) {
        symlinkSync(path.join('..', `k${to}`), path.join(cliqueDir(root, from), `to_k${to}`));
      }
    }
  }
}

// Each level's two directories link to both directories of the level below; the last level links nowhere.
function linkLattice(root: string): void {
  for (let level = 0; level < LATTICE_LEVELS - 1; level++) {
    for (const side of SIDES) {
      for (const target of SIDES) {
        symlinkSync(path.join('..', '..', `n${level + 1}`, target), path.join(levelDir(root, level, side), `to_${target}`));
      }
    }
  }
}

// The loop-closing link: src/a/up -> .. enters src/, which holds src/a, so src/x.ts is in scope only through it.
function linkLoop(root: string): void {
  symlinkSync('..', path.join(root, LOOP_LINK));
}

// The baseline: the real files with no links, and the file the loop reaches written out at its path as a real copy.
function baselineWorld(): string {
  const dir = copyWorld();
  writeRealFiles(dir);
  const reached = path.join(dir, LOOP_LINK);
  mkdirSync(reached, { recursive: true });
  cpSync(path.join(dir, 'src', 'x.ts'), path.join(reached, 'x.ts'));
  return dir;
}

// The linked world: the same real files, the clique and the lattice linked, and the loop-closing link added.
function linkedWorld(): string {
  const dir = copyWorld();
  writeRealFiles(dir);
  linkClique(dir);
  linkLattice(dir);
  linkLoop(dir);
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
  assert.doesNotMatch(output, /TST-E-|tasty build failed/i, `${label}: ref sync prints no tasty build failure, got: ${output}`);
  return readFileSync(path.join(dir, '.reference-ui', 'styled', 'styles.css'), 'utf8');
}

export default async function run(_input: SpecInput): Promise<void> {
  const baseline = baselineWorld();
  try {
    const linked = linkedWorld();
    try {
      const plainSheet = syncLeg('baseline', baseline);
      const linkedSheet = syncLeg('linked', linked);
      assert.match(plainSheet, /color: red/, 'the baseline sheet carries the colour of the file the loop reaches');
      assert.match(plainSheet, /color: blue/, 'the baseline sheet carries the colour of src/a/app.ts');
      assert.equal(linkedSheet, plainSheet, 'the linked tree writes the same stylesheet as the baseline');
    } finally {
      rmSync(linked, { recursive: true, force: true });
    }
  } finally {
    rmSync(baseline, { recursive: true, force: true });
  }
}
